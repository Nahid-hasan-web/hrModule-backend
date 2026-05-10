const path = require("path");


const pad2 = (n) => String(n).padStart(2, "0");

const monthShort = (m) =>
  ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1] || "";

const renderReportPdfPage = (doc, report, ctx) => {
    // ================= WATERMARK (DO NOT TOUCH UI) =================
  const watermarkPath = path.join(__dirname, "image", "logowatermark.png");

  const wmWidth = 600;
  const wmHeight = 600;

  const wmX = (doc.page.width - wmWidth) / 2;
  const wmY = (doc.page.height - wmHeight) / 6;

  doc.save();
  doc.opacity(0.1);
  doc.image(watermarkPath, wmX, wmY, {
    width: wmWidth,
    height: wmHeight,
  });
  doc.restore();
  // ================= END WATERMARK =================

  // ctx: { year, month, lastDay, fridaySet }

  const PAGE_LEFT = doc.page.margins.left; // 18
  const PAGE_RIGHT = doc.page.width - doc.page.margins.right; // 595-18=577
  const CONTENT_W = PAGE_RIGHT - PAGE_LEFT;

  // build full rows (1..lastDay) so table always same height
  const tableMap = new Map();
  for (const r of report.reportTable || []) tableMap.set(r.date, r);

  const mmTxt = monthShort(ctx.month);
  const yy2 = String(ctx.year).slice(-2);

  const rows = [];
  for (let d = 1; d <= ctx.lastDay; d += 1) {
    const dateTxt = `${pad2(d)}-${mmTxt}-${yy2}`;
    const iso = `${ctx.year}-${pad2(ctx.month)}-${pad2(d)}`;
    const isFriday = ctx.fridaySet?.has(iso);

    // allow remark to show even on Friday
    const rec = tableMap.get(dateTxt);

    if (isFriday) {
      if (rec) {
        rows.push([
          rec.date,
          rec.inTime || "-",
          rec.outTime || "-",
          rec.status || "",
          rec.remarks || "Weekly Holiday(Friday)",
          rec.approval || "",
        ]);
      } else {
        rows.push([dateTxt, "-", "-", "", "Weekly Holiday(Friday)", ""]);
      }
      continue;
    }

    if (!rec) {
      rows.push([dateTxt, "-", "-", "", "", ""]);
    } else {
      rows.push([
        rec.date,
        rec.inTime || "-",
        rec.outTime || "-",
        rec.status || "",
        rec.remarks || "",
        rec.approval || "",
      ]);
    }
  }

  /* ================= COMPANY TITLE ================= */
  doc
    .font("Times-Bold")
    .fontSize(13)
    .text("CapitaLand Development Limited", PAGE_LEFT, doc.y, {
      align: "center",
      width: CONTENT_W,
    });

  // thin line
  doc.moveDown(0.25);
  const titleLineY = 30;
  doc.moveTo(PAGE_LEFT, titleLineY).lineTo(PAGE_RIGHT, titleLineY).stroke();
  doc.moveDown(0.2);

  /* ================= HEADER (COMPACT) ================= */
  const headerY = doc.y;
  doc
    .font("Times-Bold")
    .fontSize(8)
    .text(report.reportHeading?.officeTime || "Office Time 10:00am-6:30pm", PAGE_LEFT, headerY, {
      width: 150,
    });

  doc
    .font("Times-Roman")
    .fontSize(9)
    .text(report.reportHeading?.title || "Monthly attendance for", PAGE_LEFT + 100, headerY, {
      width: 170,
      align: "center",
    });

  doc
    .font("Times-Bold")
    .fontSize(9)
    .text(report.reportHeading?.name || "-", PAGE_LEFT + 245, headerY, {
      width: 130,
      align: "left",
    });

  doc
    .font("Times-Roman")
    .fontSize(9)
    .text(report.reportHeading?.range || "-", PAGE_LEFT + 365, headerY, {
      width: 130,
      align: "center",
    });

  doc
    .font("Times-Bold")
    .fontSize(9)
    .text(`${report.reportHeading?.department || ""} , ID : ${report.reportHeading?.employeeId || ""}`
      .trim(),
      PAGE_LEFT,
      headerY,
      { width: CONTENT_W, align: "right" }
    );

  doc.moveDown(0.4);

  /* ================= ATTENDANCE top TABLE (SINGLE PAGE) ================= */
  const tableTop = doc.y;
  const rowH = 17;
  const headH = 20;

  const cols = [
    { label: "Date", x: PAGE_LEFT + 0, w: 50 },
    { label: "In Time", x: PAGE_LEFT + 50, w: 50 },
    { label: "Out Time", x: PAGE_LEFT + 100, w: 50 },
    { label: "Status", x: PAGE_LEFT + 150, w: 60 },
    { label: "Remarks", x: PAGE_LEFT + 210, w: 240 },
    { label: "Approval", x: PAGE_LEFT + 450, w: CONTENT_W - 450 },
  ];

  // vertical + horizontal center helper for ATTENDANCE TABLE
  const tableTextCenter = (text, x, y, w, h, fontName, fontSize) => {
    const t = String(text || "");

    doc.font(fontName).fontSize(fontSize);

    const textH = doc.heightOfString(t, {
      width: w - 4,
      align: "center",
      lineGap: 0,
    });

    const ty = y + (h - textH) / 1.2;

    doc.text(t, x + 2, ty, {
      width: w - 4,
      align: "center",
      lineGap: 0,
    });
  };

  doc.fillColor("#d1d5db").rect(PAGE_LEFT, tableTop, CONTENT_W, headH).fill();
  doc.fillColor("black").font("Times-Bold").fontSize(9);

  cols.forEach((c) => {
    doc.rect(c.x, tableTop, c.w, headH).stroke();
    tableTextCenter(c.label, c.x, tableTop, c.w, headH, "Times-Bold", 9);
  });

  let y = tableTop + headH;

  rows.forEach((r) => {
    if (r[4]) {
      doc.fillColor("#d1d5db").rect(PAGE_LEFT, y, CONTENT_W, rowH).fill();
    }
    doc.fillColor("black");

    cols.forEach((c, i) => {
      doc.rect(c.x, y, c.w, rowH).stroke();
      tableTextCenter(r[i] || "", c.x, y, c.w, rowH, "Times-Roman", 9.5);
    });

    y += rowH;
  });

  doc.y = y + 8;

  /* ================= SUMMARY PART (FIXED + PAY DAY FITS) ================= */
  doc.font("Times-Bold").fontSize(14).text("Summary", PAGE_LEFT, 601, {
    align: "center",
    width: CONTENT_W,
  });

  doc.moveDown(0.25);

  const sumX0 = PAGE_LEFT;
  let sumY = 620 // ---------------------------- summery table margin top 
  const sh = 20;

  const sw = {
    dept: 64,
    total: 52,
    working: 60,
    off: 40,
    la: 42,
    lwp: 42,
    lwop: 56,
    abs: 40,
    late: 58,
    pay: 36,
    sal: CONTENT_W - (64 + 52 + 60 + 40 + 42 + 42 + 56 + 40 + 58 + 36),
  };

  const leaveW = sw.la + sw.lwp + sw.lwop;

  const textVCenter = (text, x, y, w, h, fontName, fontSize, padX = 1, padY = 2) => {
    const t = String(text || "");

    doc.font(fontName).fontSize(fontSize);

    const textH = doc.heightOfString(t, {
      width: w - padX * 2,
      align: "center",
      lineGap: 0,
    });

    const ty = y + padY + (h - padY * 2 - textH) / 1.5;

    doc.text(t, x + padX, ty, {
      width: w - padX * 2,
      align: "center",
      lineGap: 0,
    });
  };

  const drawCell = (x, y, w, h, text, fontName, fontSize, padX, padY) => {
    doc.rect(x, y, w, h).stroke();
    textVCenter(text, x, y, w, h, fontName, fontSize, padX, padY);
  };
  // ONLY for specific cells (does NOT affect existing drawCell/textVCenter)
const drawCellVCenterOnly = (x, y, w, h, text, fontName, fontSize, padX = 1) => {
  doc.rect(x, y, w, h).stroke();

  const t = String(text || "");
  doc.font(fontName).fontSize(fontSize);

  // real glyph height based center (fixes top/bottom gap issue)
  const ascent = (doc._font.ascender / 1000) * fontSize;
  const descent = Math.abs((doc._font.descender / 1000) * fontSize);
  const fontH = ascent + descent;

  const ty = y + (h - fontH) / 1.6;

  doc.text(t, x + padX, ty, {
    width: w - padX * 2,
    align: "center",
    lineGap: 0,
  });
};


  doc.fillColor("#d1d5db").rect(sumX0, sumY, CONTENT_W, sh).fill();

  doc.fillColor("#d1d5db").rect(sumX0, sumY + sh, CONTENT_W, sh).fill();

  doc.fillColor("black");

  let x = sumX0;

  drawCell(x, sumY, sw.dept, sh * 2, "Departments", "Times-Bold", 8.6); x += sw.dept;
  drawCell(x, sumY, sw.total, sh * 2, "Total Days\nIn Month", "Times-Bold", 8.6); x += sw.total;
  drawCell(x, sumY, sw.working, sh * 2, "Actual\nWorking\nDays", "Times-Bold", 8.6); x += sw.working;
  drawCell(x, sumY, sw.off, sh * 2, "Off\nDays", "Times-Bold", 8.6); x += sw.off;

  const leaveX = x;
  drawCell(leaveX, sumY, leaveW, sh, "Leave", "Times-Bold", 9.2);
  x += leaveW;

  drawCell(x, sumY, sw.abs, sh * 2, "Absent", "Times-Bold", 9.2); x += sw.abs;
  drawCell(x, sumY, sw.late, sh * 2, "Total\nLate/Early", "Times-Bold", 8.6); x += sw.late;

  drawCell(
    x,
    sumY,
    sw.sal,
    sh * 2,
    "Salary Deduct\n(Without Pay + Absent*2\n+ Late/Early)",
    "Times-Bold",
    7.2,
    1,
    2
  );
  x += sw.sal;

  drawCell(x, sumY, sw.pay, sh * 2, "Pay\nDay", "Times-Bold", 8.6);
  x += sw.pay;

  drawCell(leaveX, sumY + sh, sw.la, sh, "Approved", "Times-Bold", 8.6);
  drawCell(leaveX + sw.la, sumY + sh, sw.lwp, sh, "With Pay", "Times-Bold", 8.6);
  drawCell(leaveX + sw.la + sw.lwp, sumY + sh, sw.lwop, sh, "Without Pay", "Times-Bold", 8.2);

  // values (USE CONTROLLER CALCULATION ONLY)
  const s = report.summary || {};
  const salaryDeduct = Number(s.salaryDeduct ?? 0);
  const payDay = Number(s.payDay ?? 0);

  sumY += sh * 2;

  const itRow = [
    "From IT",
    String(s.totalDaysInMonth ?? ""),
    String(s.actualWorkingDays ?? ""),
    String(s.offDays ?? ""),
    String(s.leaveApproved ?? ""),
    String(s.leaveWithPay ?? ""),
    String(s.leaveWithoutPay ?? ""),
    String(s.absent ?? ""),
    String(s.totalLateEarly ?? ""),
    String(salaryDeduct),
    String(payDay),
  ];

  
  const widths = [sw.dept, sw.total, sw.working, sw.off, sw.la, sw.lwp, sw.lwop, sw.abs, sw.late, sw.sal, sw.pay];

  x = sumX0;
  itRow.forEach((v, i) => {
    drawCellVCenterOnly(x, sumY, widths[i], 17, v, "Times-Roman", 9.2, 1);
    x += widths[i];
  });


  // HR row (WITH BOXES)
  sumY += sh;

  let hrX = sumX0;
  const hrRowHeight = 677 // ---------------------------- HR table margin top 
  // ------- from hr cell
  drawCellVCenterOnly(hrX, hrRowHeight, sw.dept, 17, "From HR", "Times-Roman", 9.2);
  hrX += sw.dept;

  // -------- final summery cell
  const finalSummaryW = sw.total + sw.working + sw.off + sw.la + sw.lwp + sw.lwop;
  drawCellVCenterOnly(hrX, hrRowHeight, finalSummaryW, 17, "Final Summary", "Times-Bold", 9.2);
  hrX += finalSummaryW;
  // --------------- from hr ather row
  drawCellVCenterOnly(hrX, hrRowHeight, sw.abs, 17, "", "Times-Roman", 9.2); hrX += sw.abs;
  drawCellVCenterOnly(hrX, hrRowHeight, sw.late, 17, "", "Times-Roman", 9.2); hrX += sw.late;
  drawCellVCenterOnly(hrX, hrRowHeight, sw.sal, 17, "", "Times-Roman", 9.2); hrX += sw.sal;
  drawCellVCenterOnly(hrX, hrRowHeight, sw.pay, 17, "", "Times-Roman", 9.2);

  /* ================= NOTE ================= */
  doc.y = sumY + sh ;


doc.font("Times-Bold").fontSize(9).text("Note: ", PAGE_LEFT, doc.y, { continued: true });
doc.font("Times-Bold").text("(1)", { continued: true });
doc.fillColor("black").text(" day’s salary will be ", { continued: true });

doc.font("Times-Bold").text("deducted", { continued: true });
doc.font("Times-Roman").text(" for ", { continued: true });
doc.font("Times-Bold").text("(4)", { continued: true });
doc.font("Times-Roman").text(" late arrivals or early departures. ", { continued: true });

doc.font("Times-Bold").text("(2)", { continued: true });
doc.font("Times-Roman").text(" days’ salary will be ", { continued: true });
doc.font("Times-Bold").text("deducted", { continued: true });

doc.fillColor("black").font("Times-Roman").text(" for ", { continued: true });
doc.fillColor("black")
doc.font("Times-Bold").text("(1)", { continued: true });
doc.font("Times-Roman").text(" day of ", { continued: true });
doc.font("Times-Bold").text("unauthorized absence.", {
  width: CONTENT_W,
  align: "left",
});


  doc.moveDown(6.7);


/* ================= SIGNATURES ================= */

/* ================= EMPLOYEE SIGNATURE ================= */
doc.moveTo(PAGE_LEFT + 0, 745).lineTo(PAGE_LEFT + 105, 745).stroke();
doc.font("Times-Roman").fontSize(9).text("Employee Signature", PAGE_LEFT + 0, 750, {
  width: 105,
  align: "center",
});

/* ================= IT SIGNATURE ================= */
doc.moveTo(PAGE_LEFT + 0, 805).lineTo(PAGE_LEFT + 105, 805).stroke();
doc.font("Times-Roman").fontSize(8).text("Prepared By", PAGE_LEFT + 0, 810, {
  width: 105,
  align: "center",
});
doc.text("IT Dept", PAGE_LEFT + 0, 820, { width: 105, align: "center" });

/* ================= HR SIGNATURE ================= */
doc.moveTo(PAGE_LEFT + 115, 805).lineTo(PAGE_LEFT + 220, 805).stroke();
doc.font("Times-Roman").fontSize(8).text("Verified by", PAGE_LEFT + 115, 810, {
  width: 105,
  align: "center",
});
doc.text("HR", PAGE_LEFT + 115, 820, { width: 105, align: "center" });

/* ================= ED SIGNATURE ================= */
doc.moveTo(PAGE_LEFT + 230, 805).lineTo(PAGE_LEFT + 335, 805).stroke();
doc.font("Times-Bold").fontSize(8).text("Brig Gen Sayeedur Rahman", PAGE_LEFT + 230, 810, {
  width: 105,
  align: "center",
});
doc.font("Times-Roman").fontSize(8).text("Executive Director", PAGE_LEFT + 230, 820, {
  width: 105,
  align: "center",
});

/* ================= GD SIGNATURE ================= */
doc.moveTo(PAGE_LEFT + 345, 805).lineTo(PAGE_LEFT + 450, 805).stroke();
doc.font("Times-Bold").fontSize(8).text("Jahan Sultana Khan", PAGE_LEFT + 345, 810, {
  width: 105,
  align: "center",
});
doc.font("Times-Roman").fontSize(8).text("Group Director", PAGE_LEFT + 345, 820, {
  width: 105,
  align: "center",
});

/* ================= MD SIGNATURE ================= */
doc.moveTo(PAGE_LEFT + 460, 805).lineTo(PAGE_LEFT + 565, 805).stroke();
doc.font("Times-Bold").fontSize(8).text("Mukarram Husain Khan", PAGE_LEFT + 460, 810, {
  width: 105,
  align: "center",
});
doc.font("Times-Roman").fontSize(8).text("Managing Director", PAGE_LEFT + 460, 820, {
  width: 105,
  align: "center",
});








};

module.exports = { renderReportPdfPage };

