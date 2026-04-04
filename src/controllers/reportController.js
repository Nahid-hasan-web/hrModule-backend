// controllers/reportController.js

const PDFDocument = require("pdfkit");
const { renderReportPdfPage } = require("../utility/reportPdf");

// MODELS
const attendanceDataModel = require("../models/attendanceDataModel");
const remarkModel = require("../models/remarkModel");
const leaveModel = require("../models/leaveModel");
const emplyeeModel = require("../models/emplyeeModel");
const customMoHolidayModel = require("../models/customMoHolidayModel");
const commonSchedule = require("../models/commonSchedule");

// =======================================================
// HELPERS
// =======================================================
const getDatesBetween = (startDate, endDate) => {
  const dates = [];
  let current = new Date(startDate);

  while (current <= new Date(endDate)) {
    dates.push(new Date(current)); // push copy
    current.setDate(current.getDate() + 1);
  }

  return dates;
};
const pad2 = (n) => String(n).padStart(2, "0");

// YYYY-MM-DD (LOCAL)
const ymdLocal = (dt) =>
  `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;

// Safe date parser
const parseAnyDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

//  remark-safe key: use UTC Y/M/D only, then local midnight
const remarkDayKey = (val) => {
  const d = parseAnyDate(val);
  if (!d) return "";
  const localMidnight = new Date(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
  );
  return ymdLocal(localMidnight);
};

//  holiday-safe: use UTC Y/M/D only, then local midnight (same style)
const buildHolidayFromRanges = (holidayDocs) => {
  const holidaySet = new Set(); // key: YYYY-MM-DD (LOCAL)
  const holidayNameMap = new Map(); // key -> holidayName

  for (const h of holidayDocs || []) {
    const s0 = parseAnyDate(h.holidayStartDate);
    const e0 = parseAnyDate(h.holidayEndDate);
    if (!s0 || !e0) continue;

    let cur = new Date(s0.getUTCFullYear(), s0.getUTCMonth(), s0.getUTCDate());
    const end = new Date(
      e0.getUTCFullYear(),
      e0.getUTCMonth(),
      e0.getUTCDate(),
    );

    const name = String(h.holidayName || "Holiday").trim() || "Holiday";

    while (cur <= end) {
      const key = ymdLocal(cur);
      holidaySet.add(key);
      if (!holidayNameMap.has(key)) holidayNameMap.set(key, name);

      cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
    }
  }

  return { holidaySet, holidayNameMap };
};

//  NEW: time to seconds helper (for employee-wise in/out comparison)
const timeToSec = (t) => {
  if (!t || t === "-" || t === "--") return null;

  // supports "HH:mm", "HH:mm:ss"
  if (typeof t === "string" && t.includes(":")) {
    const parts = t
      .trim()
      .split(":")
      .map((x) => Number(x));
    const hh = parts[0] ?? 0;
    const mm = parts[1] ?? 0;
    const ss = parts[2] ?? 0;
    if ([hh, mm, ss].some((n) => Number.isNaN(n))) return null;
    return hh * 3600 + mm * 60 + ss;
  }

  // supports Date / ISO string
  const d = new Date(t);
  if (isNaN(d.getTime())) return null;
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
};
// check schedule type (single or multi day)
const isSameDate = (d1, d2) => {
  return ymdLocal(new Date(d1)) === ymdLocal(new Date(d2));
};

// =======================================================
// CONTROLLER
// =======================================================

const reportController = async (req, res) => {
  try {
    // ================= INPUT =================
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    const filterEmployeeIdRaw = req.query.employeeId;
    const filterEmployeeId =
      filterEmployeeIdRaw !== undefined && filterEmployeeIdRaw !== null
        ? String(filterEmployeeIdRaw).trim()
        : "";

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({
        ok: false,
        message: "year and month are required. example: ?year=2026&month=1",
      });
    }

    // ---------------- GET SCHEDULE ----------------
    const schedules = await commonSchedule.find().lean();

    // const allDates = getDatesBetween(
    //   schedule.scheduleFrom,
    //   schedule.scheduleTo,
    // );

    // ================= RANGE =================
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    const rangeStart = new Date(year, month - 1, 1);
    const rangeEnd = new Date(
      year,
      month - 1,
      totalDaysInMonth,
      23,
      59,
      59,
      999,
    );

    // ================= FRIDAY =================
    const fridaySet = new Set();
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dt = new Date(year, month - 1, d);
      if (dt.getDay() === 5) fridaySet.add(ymdLocal(dt));
    }

    // ================= CUSTOM HOLIDAY (schema: holidayStartDate, holidayEndDate) =================
    const customHolidays = await customMoHolidayModel
      .find({
        holidayStartDate: { $lte: rangeEnd },
        holidayEndDate: { $gte: rangeStart },
      })
      .lean();

    const { holidaySet, holidayNameMap } =
      buildHolidayFromRanges(customHolidays);

    // ================= SUMMARY OFF DAYS =================
    const offDaySet = new Set([...fridaySet, ...holidaySet]);
    const offDays = offDaySet.size;
    const actualWorkingDays = totalDaysInMonth - offDays;

    // ================= ATTENDANCE =================
    const allAttendance = await attendanceDataModel.find().lean();

    const attendance = [];
    const employeeIdSet = new Set();

    for (const a of allAttendance) {
      if (filterEmployeeId && String(a.employeeId) !== filterEmployeeId)
        continue;

      const dt = parseAnyDate(a.date || a.createdAt);
      if (!dt) continue;
      if (dt.getFullYear() !== year) continue;
      if (dt.getMonth() !== month - 1) continue;

      const iso = ymdLocal(dt);
      employeeIdSet.add(a.employeeId);
      attendance.push({ a, dt, iso });
    }

    if (attendance.length === 0) {
      return res.status(404).json({
        ok: false,
        message: filterEmployeeId
          ? "No attendance found for this employee in this month/year"
          : "No attendance found for this month/year",
        employeeId: filterEmployeeId || undefined,
        year,
        month,
      });
    }

    // ================= EMPLOYEES =================
    const employees = await emplyeeModel
      .find({ employeeId: { $in: Array.from(employeeIdSet) } })
      .lean();

    const employeeMap = new Map();
    employees.forEach((e) => employeeMap.set(String(e.employeeId), e));

    if (filterEmployeeId && !employeeMap.has(filterEmployeeId)) {
      return res.status(404).json({
        ok: false,
        message: "Employee not found in emplyeeModel. Report not generated.",
        employeeId: filterEmployeeId,
      });
    }

    // keep only allowed employees
    const filteredAttendance = [];
    const allowedEmployeeIdSet = new Set();

    for (const item of attendance) {
      const eid = String(item.a.employeeId);
      if (!employeeMap.has(eid)) continue;
      filteredAttendance.push(item);
      allowedEmployeeIdSet.add(eid);
    }

    if (filteredAttendance.length === 0) {
      return res.status(404).json({
        ok: false,
        message:
          "No report generated because matching employees were not found in emplyeeModel.",
        employeeId: filterEmployeeId || undefined,
        year,
        month,
      });
    }

    // ================= LEAVES (unchanged) =================
    const leaves = await leaveModel
      .find({
        status: "approved",
        startDate: { $lte: rangeEnd },
        endDate: { $gte: rangeStart },
        ...(filterEmployeeId
          ? { employeeId: filterEmployeeId }
          : { employeeId: { $in: Array.from(allowedEmployeeIdSet) } }),
      })
      .lean();

    const leaveMap = new Map();
    for (const lv of leaves) {
      const eid = String(lv.employeeId);
      if (!employeeMap.has(eid)) continue;
      if (!leaveMap.has(eid)) leaveMap.set(eid, []);
      leaveMap.get(eid).push(lv);
    }

    // ================= REMARKS   =================
    const remarks = await remarkModel
      .find({
        approval: "approved",
        ...(filterEmployeeId
          ? { employeeId: filterEmployeeId }
          : { employeeId: { $in: Array.from(allowedEmployeeIdSet) } }),
      })
      .lean();
    // eid -> Map(isoDay -> remarkDoc)
    const remarkMap = new Map();
    for (const rm of remarks) {
      const eid = String(rm.employeeId);
      if (!employeeMap.has(eid)) continue;

      const key = remarkDayKey(rm.date); //  only one day key
      if (!key) continue;

      if (!remarkMap.has(eid)) remarkMap.set(eid, new Map());
      remarkMap.get(eid).set(key, rm);
    }

    // ================= BUILD REPORT =================
    const reportMap = new Map();
    const addedDateMap = new Map(); // eid -> Set(iso)

    for (const { a, dt, iso } of filteredAttendance) {
      const eid = String(a.employeeId);

      if (!reportMap.has(eid)) {
        const emp = employeeMap.get(eid);

        reportMap.set(eid, {
          reportHeading: {
            name: emp?.name || a.name,
            department: emp?.department || "",
            employeeId: emp?.employeeId || eid,
            officeTime:
              emp?.inTime && emp?.outTime
                ? `Office Time : ${new Date(emp.inTime).toLocaleTimeString(
                    "en-GB",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )} AM - 06:30 PM`
                : "--",
            title: "Monthly Attendance For",
            range: `[${pad2(1)}-${pad2(month)}-${year} to ${pad2(
              totalDaysInMonth,
            )}-${pad2(month)}-${year}]`,
          },

          summary: {
            department: emp?.department || "",
            totalDaysInMonth,
            actualWorkingDays,
            offDays,
            leaveApproved: 0,
            leaveWithPay: 0,
            leaveWithoutPay: 0,
            absent: 0,
            totalLateEarly: 0,
            salaryDeduct: 0,
            payDay: 0,
          },

          reportTable: [],
        });
      }

      if (!addedDateMap.has(eid)) addedDateMap.set(eid, new Set());
      if (addedDateMap.get(eid).has(iso)) continue;
      addedDateMap.get(eid).add(iso);

      const rpt = reportMap.get(eid);

      const rm = remarkMap.get(eid)?.get(iso) || null;

      const isFriday = fridaySet.has(iso);
      const isCustomHoliday = holidaySet.has(iso);
      const holidayName = holidayNameMap.get(iso) || "";

      let status = "";
      let remarksText = "";
      let approval = "";
      let scheduleLabel = "";
      // ================= RULE PRIORITY =================
      // 1) remark ( status removed)
      // 2) custom holiday (show name,  NOT count)
      // 3) friday
      // 4) normal count

      if (rm) {
        // remark day fully controls row
        remarksText = rm.remark || "";
        approval = rm.approval || "";

        // always reset first
        status = "";

        // only this remark creates absence
        if (rm.remark === "Absent (Forcefully)") {
          status = "Absent";
          rpt.summary.absent += 1;
        }
      } else if (isCustomHoliday) {
        // custom holiday applies to all employees
        remarksText = holidayName || "Holiday";

        // holiday day → NEVER show status
        status = "";
      } else if (isFriday) {
        remarksText = "Weekly Holiday (Friday)";
        status = "";
      } else {
        const emp = employeeMap.get(eid);

        // ---------------- HELPERS ----------------
        const normalizeDate = (d) => {
          const date = new Date(d);
          if (isNaN(date)) return null;

          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");

          return `${year}-${month}-${day}`;
        };

        const scheduleMap = new Map();

        for (const sch of schedules) {
          const dates = getDatesBetween(sch.scheduleFrom, sch.scheduleTo);

          for (const d of dates) {
            const key = normalizeDate(d);

            // last one wins (latest schedule overrides)
            // scheduleMap.set(key, sch);
            if (!scheduleMap.has(key)) {
              scheduleMap.set(key, sch);
            } else {
              // overwrite only if current schedule is more specific (shorter range)
              const existing = scheduleMap.get(key);

              const existingDays =
                (new Date(existing.scheduleTo) -
                  new Date(existing.scheduleFrom)) /
                (1000 * 60 * 60 * 24);

              const newDays =
                (new Date(sch.scheduleTo) - new Date(sch.scheduleFrom)) /
                (1000 * 60 * 60 * 24);

              // smaller range = higher priority
              if (newDays < existingDays) {
                scheduleMap.set(key, sch);
              }
            }
          }
        }

        function getTimeInSeconds(dateStr) {
          const date = new Date(dateStr);
          return date.getUTCHours() * 3600 + date.getUTCMinutes() * 60;
        }

        function getTimeInSeconds(dateStr) {
          const date = new Date(dateStr); // Convert the ISO string to a Date object
          const hours = date.getUTCHours(); // Get hours in UTC
          const minutes = date.getUTCMinutes(); // Get minutes in UTC
          const totalSeconds = hours * 60 * 60 + minutes * 60; // Convert to seconds
          return totalSeconds;
        }

        // ---------------- FAST LOOKUP ----------------
        const currentSchedule = scheduleMap.get(normalizeDate(a.date));
        // ================= SCHEDULE NAME LOGIC =================
        if (currentSchedule) {
          const start = normalizeDate(currentSchedule.scheduleFrom);
          const end = normalizeDate(currentSchedule.scheduleTo);
          const today = normalizeDate(a.date);

          // 1 day schedule
          if (start === end) {
            scheduleLabel = currentSchedule.scheduleName;
          }
          // multi day schedule → only first day
          else if (today === start) {
            scheduleLabel = currentSchedule.scheduleName;
          }
        }
        // ---------------- MACHINE DATA ----------------
        const actualInSec = timeToSec(a.inTime);
        const actualOutSec = timeToSec(a.outTime);

        // ---------------- CHECK DATE ----------------

        // ---------------- DECIDE OFFICE TIME ----------------

        let officeInSec;
        let officeOutSec;

        const isRamadanSchedule =
          currentSchedule &&
          currentSchedule.scheduleName &&
          currentSchedule.scheduleName.toLowerCase().includes("ramadan");

        if (emp?.employeeType === "STAFF" && isRamadanSchedule) {
          officeInSec = timeToSec("08:30");
          officeOutSec = timeToSec("15:30");
        } else if (currentSchedule) {
          // START TIME
          if (currentSchedule.scheduleStartTime) {
            officeInSec = getTimeInSeconds(currentSchedule.scheduleStartTime);
          } else {
            officeInSec = timeToSec(emp?.inTime);
          }

          // END TIME
          if (currentSchedule.scheduleEndtTime) {
            officeOutSec = getTimeInSeconds(currentSchedule.scheduleEndtTime);
          } else {
            officeOutSec = timeToSec(emp?.outTime);
          }
        } else {
          officeInSec = timeToSec(emp?.inTime);
          officeOutSec = timeToSec(emp?.outTime);
        }
        // ---------------- FINAL LOGIC ----------------
        const isLate =
          actualInSec !== null &&
          officeInSec !== null &&
          actualInSec > officeInSec;

        const isEarly =
          actualOutSec !== null &&
          officeOutSec !== null &&
          actualOutSec < officeOutSec;

        // ---------------- STATUS ----------------
        if (a.isAbsent) {
          status = "Absent";
          rpt.summary.absent += 1;
        } else if (isLate && isEarly) {
          status = "Late & Early";
          rpt.summary.totalLateEarly += 2;
        } else if (isLate) {
          status = "Late";
          rpt.summary.totalLateEarly += 1;
        } else if (isEarly) {
          status = "Early";
          rpt.summary.totalLateEarly += 1;
        }

        // DEBUG (remove later)
        console.log({
          rawDate: a.date,
          normalized: normalizeDate(a.date),
          currentSchedule: currentSchedule?.scheduleName || null,
          isLate,
          isEarly,
        });
      }
      // ---------------- changing the time on 12 am pm formet
      const to12Hour = (time) => {
        if (!time || time === "-" || time === "--") return time;

        const [h, m] = time.split(":").map(Number);
        const ampm = h >= 12 ? "PM" : "AM";
        const hour = h % 12 || 12;

        return `${String(hour).padStart(2, "0")}:${String(m).padStart(
          2,
          "0",
        )} ${ampm}`;
      };

      //  In/Out rule for remark: keep times, but if missing show "--"
      const inTimeOut = rm
        ? to12Hour(a.inTime || "--")
        : to12Hour(a.inTime || "-");
      const outTimeOut = rm
        ? to12Hour(a.outTime || "--")
        : to12Hour(a.outTime || "-");
      // ================= ADD SCHEDULE TO REMARK =================
      if (scheduleLabel) {
        if (remarksText) {
          remarksText = `${scheduleLabel} | ${remarksText}`;
        } else {
          remarksText = scheduleLabel;
        }
      }
      rpt.reportTable.push({
        date: `${pad2(dt.getDate())}-${dt.toLocaleString("en-US", {
          month: "short",
        })}-${String(year).slice(-2)}`,
        inTime: inTimeOut,
        outTime: outTimeOut,
        status,
        remarks: remarksText,
        approval,
      });
    }

    // ================= FINAL CALC (unchanged) =================
    const reports = Array.from(reportMap.values()).map((r) => {
      const lateDays = r.summary.totalLateEarly || 0;
      const lateDeduct = Math.floor(lateDays / 4);

      r.summary.salaryDeduct =
        r.summary.leaveWithoutPay + r.summary.absent * 2 + lateDeduct;

      r.summary.payDay = r.summary.totalDaysInMonth - r.summary.salaryDeduct;
      if (r.summary.payDay < 0) r.summary.payDay = 0;
      return r;
    });

    const finalReports = filterEmployeeId
      ? reports.filter(
          (r) => String(r.reportHeading.employeeId) === filterEmployeeId,
        )
      : reports;

    if (finalReports.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "No report data found for this month",
        employeeId: filterEmployeeId || undefined,
        year,
        month,
      });
    }

    // ================= PDF DOWNLOAD =================
    res.setHeader("Content-Type", "application/pdf");

    const filename = filterEmployeeId
      ? `attendance-${filterEmployeeId}-${year}-${pad2(month)}.pdf`
      : `attendance-${year}-${pad2(month)}.pdf`;

    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: 15,
        bottom: 10,
        left: 18,
        right: 18,
      },
    });
    doc.pipe(res);

    const ctx = { year, month, lastDay: totalDaysInMonth, fridaySet };

    finalReports.forEach((r, i) => {
      renderReportPdfPage(doc, r, ctx);
      if (i < finalReports.length - 1) doc.addPage();
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: "Internal Server Error from reportController",
      error: err.message,
    });
  }
};

module.exports = { reportController };
