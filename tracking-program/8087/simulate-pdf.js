/**
 * simulate-pdf.js
 * Generates just the Detail Worksheet section of the Bill Analytics PDF
 * using synthetic data, so layout/overflow issues can be inspected without
 * needing a live project.
 *
 * Run:  node simulate-pdf.js
 * Output: /tmp/simulate-bill-analytic.pdf
 */

'use strict';

const PdfPrinter = require('./node_modules/pdfmake');
const fs = require('fs');
const path = require('path');

const fonts = {
  Roboto: {
    normal: '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    bold: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    italics: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf',
    bolditalics: '/usr/share/fonts/truetype/dejavu/DejaVuSans-BoldOblique.ttf',
  }
};

const printer = new PdfPrinter(fonts);

// ─── Real bill data captured from Cloud Kitchen - Dallas project ─────────────
const billData = {
  "projectCurrency": "USD",
  "date": "March 14, 2026",
  "reportNumber": "",
  "clientName": "Cloud Kitchen",
  "clientAddress": "",
  "clientAccount": "0000360366",
  "clientSupplier": "Engie Resources",
  "location": "",
  "preparedFor": "Cloud Kitchen\n",
  "preparedBy": "",
  "auditedBy": "",
  "attn": "Greg Dockery, CEO",
  "estimatedSavingsPercent": "13.52",
  "baselineSavingsPercent": "9.20",
  "estimatedROI": 17,
  "baselineROI": 26,
  "recommendedUnits": 3,
  "reference": "000036036620251117",
  "reportDate": "March 14, 2026",
  "version": "1",
  "estimatedSavings": {
    "totalCharges": "$3,297.70",
    "monthEndCharge": "$3,297.68",
    "customerCharge": "$0.00",
    "totalSavings": "$303.28",
    "bill": "$2,994.42",
    "annualSavings": "$3,639.38",
    "xecoEquipmentCost": "$7,128.00",
    "partCost": "$2,630.00",
    "projectManagementCost": "$0.00",
    "meteringFee": "$799.00",
    "shippingFee": "$49.00",
    "discount": "-$0.00",
    "totalCost": "$7,976.00",
    "co2Reduction": 5.01,
    "salesTax": 0
  },
  "billAnalysis": {
    "bill": "$3,297.68",
    "kwhConsumed": 25821,
    "kwhTotalRate": 0.06145,
    "demandChargeRate": "$12.00",
    "baselineKwh": "6,759",
    "demand": "19,062",
    "totalOverageCost": "$1,171.35",
    "totalCharges": "$3,297.70",
    "totalReference2Section1Charges": "$1,235.28",
    "reference2Section1Charges": [
      { "name": "TRANSMISSION COST RECOVERY FACTOR", "amount": "$501.27" },
      { "name": "DISTRIBUTION SYSTEM CHARGE",        "amount": "$701.58" },
      { "name": "METERING CHARGE",                   "amount": "$21.30"  },
      { "name": "CUSTOMER CHARGE",                   "amount": "$11.13"  }
    ],
    "totalReference2Section2Charges": "$1,817.69",
    "reference2Section2Charges": [
      { "name": "CUSTOMER CHARGE",                     "amount": "$11.13"   },
      { "name": "DISTRIBUTION COST RECOVERY FACTOR",   "amount": "$142.05"  },
      { "name": "Energy Efficiency",                   "amount": "$5.76"    },
      { "name": "Nuclear Decommission",                "amount": "$6.17"    },
      { "name": "Fixed Energy Charge",                 "amount": "$1,581.02"},
      { "name": "Ancillary Svcs",                      "amount": "$12.12"   },
      { "name": "Gross Receipts Tax",                  "amount": "$59.44"   },
      { "name": "",                                    "amount": ""         },
      { "name": "",                                    "amount": ""         },
      { "name": "",                                    "amount": ""         }
    ],
    "reference3Charges": [
      { "name": "Sales Tax State", "amount": "$195.04" },
      { "name": "Sales Tax City",  "amount": "$60.82"  }
    ]
  },
  "calculatedWaste": {
    "kwhConsumed": "25,821",
    "Kw15Min": "36",
    "avgAmpDraw": "75",
    "avgAmpDrawNum": 74.71354166666667,
    "powerFactor": 26.18,
    "reactiveKvarWaste": 73.82,
    "reactiveKvarSupplyWasteAmps": 55,
    "ampSavings": "22",
    "kwSavings": "11",
    "kwhSavings": "7,063"
  },
  "reference3": {
    "customerCharge": "$0.00",
    "totalAdditional": "$255.86",
    "totalCurrent": "$3,297.70"
  },
  "supplySide": {
    "billedKw": 137
  }
};

// ─── Same constants as bill-analytic.js ──────────────────────────────────────
const PAGE_WIDTH    = 612;
const MARGIN_LEFT   = 50;
const MARGIN_RIGHT  = 36;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 526
const RIGHT_SAFETY  = Math.ceil(PAGE_WIDTH * 0.01);  // 7pt

const lightGrayBG   = '#d9d9d9';
const darkGrayBg    = '#808080';
const noBordersCell = [false, false, false, false];

function spanCell(cell, span) {
  const cells = [Object.assign({}, cell, { colSpan: span })];
  for (let i = 1; i < span; i++) cells.push({ text: '', border: noBordersCell });
  return cells;
}

// Pull in the actual generator to exercise the real code path
const generator = require('./api/services/pdf/generators/bill-analytic.js')(printer);

// We can't call generate() without real image paths, so instead build a
// standalone doc that reproduces just the Detail Worksheet table —
// using the exact same structure as the real file.
const _ = { round: (n, d) => Math.round(n * Math.pow(10, d||0)) / Math.pow(10, d||0) };

function getAnalysisChargesRows(charges) {
  return charges.map(charge => [
    ...spanCell({ border: [true, false, false, false], margin: [-3, -2, 0, -2], text: charge.name }, 2),
    { border: noBordersCell, margin: [0, -2, 0, -2], text: charge.amount, style: { alignment: 'right' } },
    ...spanCell({ border: [false, false, true, false], text: '' }, 3),
  ]);
}

function getReference3ChargeRows(charges) {
  return charges.map(charge => [
    { border: [true, false, false, false], margin: [0, 0, -2, 0], text: charge.name },
    { border: noBordersCell, margin: [50, 0, 0, 0], text: charge.amount, style: { alignment: 'right' } },
    ...spanCell({ border: [false, false, true, false], text: '' }, 2),
  ]);
}

// ─── Add a visible RIGHT-MARGIN GUIDE at CONTENT_WIDTH ───────────────────────
// A thin red vertical line drawn at x = CONTENT_WIDTH shows exactly where the
// right content boundary is.  Any content crossing this is overflowing.
const rightGuide = {
  absolutePosition: { x: MARGIN_LEFT + CONTENT_WIDTH, y: 0 },
  canvas: [{ type: 'line', x1: 0, y1: 0, x2: 0, y2: 792, lineWidth: 0.5,
             lineColor: 'red' }]
};

const docDefinition = {
  pageMargins: [MARGIN_LEFT, 50, MARGIN_RIGHT, 50],
  defaultStyle: { fontSize: 9 },
  styles: {
    headerCell:  { bold: true, color: 'white', fillColor: 'black' },
    grayHeader:  { bold: true, color: 'white', fillColor: darkGrayBg },
    noteText:    { fontSize: 7 },
    sectionBar:  { bold: true, decoration: 'underline', fillColor: '#c5d9f1' },
  },
  content: [
    // ── Right-margin guide line ──
    rightGuide,

    // ── Worksheet title ──
    {
      margin: [0, 0, RIGHT_SAFETY, 0],
      text: 'SYNEREX Bill Analytics Detail Worksheet',
      style: { alignment: 'center', bold: true, fontSize: 12 }
    },

    // ── Company / Location header ──
    {
      margin: [0, 10, RIGHT_SAFETY, 0],
      layout: 'noBorders',
      table: {
        widths: [60, '*', 180],
        body: [[
          { text: 'Company:', style: { alignment: 'right' } },
          { margin: [-5, 0, 0, 0], text: billData.clientName },
          { text: ['Location:', { text: billData.location }],
            style: { bold: true, decoration: 'underline' } }
        ],[
          { text: '' },
          { margin: [-5, -2, 0, 0], text: billData.clientAddress.split('\n')[0] },
          { text: '' }
        ],[
          { text: '' },
          { margin: [-5, -2, 0, 0], text: billData.clientAddress.split('\n')[1] },
          { text: '' }
        ]]
      },
      style: { fontSize: 8, bold: true }
    },

    // ── Main Detail Worksheet table ──
    {
      margin: [0, 0, RIGHT_SAFETY, 0],
      table: {
        widths: [95, 95, '*', '*', '*', '*'],
        body: [
          // Reference / Date / Supplier / Account / Energy Audit row
          [
            { border: noBordersCell, stack: [
              { text: 'Reference:', style: { bold: true, decoration: 'underline' } },
              { text: billData.reference, style: { fontSize: 8 } }
            ], style: { alignment: 'right' } },
            { border: noBordersCell, stack: [
              { text: 'Report Date:', style: { bold: true, decoration: 'underline' } },
              { text: billData.reportDate, style: { fontSize: 8 } }
            ], style: { alignment: 'right' }, rowSpan: 2 },
            { border: noBordersCell, stack: [
              { text: 'Supplier:', style: { bold: true, decoration: 'underline' } },
              { text: billData.clientSupplier, style: { fontSize: 8 } }
            ], style: { alignment: 'center' }, rowSpan: 2 },
            { border: noBordersCell, stack: [
              { text: 'Account:', style: { bold: true, decoration: 'underline' } },
              { text: billData.clientAccount, style: { fontSize: 8 } }
            ], style: { alignment: 'right' }, rowSpan: 2, colSpan: 2 },
            { border: noBordersCell, text: '' },
            { border: noBordersCell, stack: [
              { text: 'Energy Audit By:', style: { bold: true, decoration: 'underline' } },
              { text: billData.auditedBy, style: { fontSize: 8 } }
            ], style: { alignment: 'center' }, rowSpan: 2 },
          ],
          [
            { border: noBordersCell, text: 'Currency values based on ' + billData.projectCurrency,
              colSpan: 6, style: { fontSize: 6, bold: true, alignment: 'right' } },
          ],
          // Electric Bill Evaluation header
          [{ margin: [0, -4, 0, -4], text: 'Electric Bill Evaluation/Analysis', colSpan: 6,
             style: { bold: true, alignment: 'center', fontSize: 12, color: 'white', fillColor: darkGrayBg } }],

          // REFERENCE #1 header
          [
            { border: [true, false, false, false], margin: [-3, -2, -3, -2], text: 'REFERENCE #1',
              style: { bold: true, fontSize: 11, color: 'white', fillColor: 'black' } },
            { border: [false, false, true, false], margin: [0, -2, 0, -2], text: 'ELECTRICITY CONSUMPTION DATA',
              colSpan: 5, style: { bold: true, fontSize: 11, color: 'white', fillColor: 'black' } },
          ],

          // Bill
          [
            { border: [true, false, false, false], margin: [-3, 0, -3, 0], text: 'Bill', style: { fontSize: 10 } },
            { border: noBordersCell, text: billData.billAnalysis.bill, style: { alignment: 'right', fontSize: 10 } },
            { border: [false, false, true, false], colSpan: 4, text: '' },
          ],

          // kWh Consumed
          [
            { border: [true, false, false, false], margin: [-3, -5, -3, 0], text: 'kWh Consumed:',
              style: { fontSize: 9 } },
            { border: noBordersCell, margin: [0, -5, 0, 0], text: String(billData.billAnalysis.kwhConsumed),
              style: { alignment: 'right', fontSize: 9 } },
            { border: [false, false, true, false], margin: [-5, -2, 0, 0], colSpan: 4,
              text: '----This rate is calculated and based on electricity consumption from the electric bill (kWh).',
              style: { fontSize: 7 } }
          ],

          // kWh Total Rate
          [
            { border: [true, false, false, false], margin: [-3, -5, -3, 0], text: 'kWh Total Rate:',
              style: { fontSize: 9 } },
            { margin: [0, -2, 0, -3], text: billData.billAnalysis.kwhTotalRate,
              style: { alignment: 'right', fontSize: 9 } },
            { border: [false, false, true, false], colSpan: 4, text: '' }
          ],

          // Baseline kWh
          [
            { margin: [0, 15, 0, 0], border: [true, false, false, false], colSpan: 3, text: '' },
            { text: '' }, { text: '' },
            { border: [false, false, true, false], margin: [0, -3, 0, 0], colSpan: 3, rowSpan: 3,
              text: ['kVA Demand charge is based on a rate of ',
                { text: billData.billAnalysis.demandChargeRate, style: { bold: true, decoration: 'underline' } },
                ' per kW. Overage is converted to kWh used above Baseline Supply.'],
              style: { fontSize: 7 } }
          ],
          [
            { border: [true, false, false, false], margin: [-3, 0, -3, 0], text: 'Baseline kWh:(Supply)',
              style: { fontSize: 9 } },
            { margin: [0, 0, 0, 0], border: noBordersCell, text: String(billData.billAnalysis.baselineKwh),
              style: { alignment: 'right', fontSize: 9 } },
            { border: [false, false, true, false], margin: [-5, 0, 0, 0], colSpan: 4,
              text: 'kWh ---- based on Load Factor', style: { fontSize: 7, bold: true } }
          ],
          [
            { border: [true, false, false, false], margin: [-3, -5, -3, 0], text: 'Demand', style: { fontSize: 9 } },
            { margin: [0, -5, 0, 0], border: noBordersCell, text: String(billData.billAnalysis.demand),
              style: { alignment: 'right', fontSize: 9 } },
            { border: [false, false, true, false], margin: [-5, -5, 0, 0], colSpan: 4,
              text: 'kWh Overage ---- based on Demand', style: { fontSize: 7, bold: true } }
          ],

          // Total Overage Cost
          [{ border: [true, false, true, false], margin: [0, 10, 0, 0], text: '', colSpan: 6 }],
          [
            { border: [true, true, false, true], margin: [-3, -3, -3, 0], text: 'Total Overage Cost:',
              style: { fontSize: 9, bold: true } },
            { border: [false, true, false, true], margin: [0, -3, 0, 0],
              text: billData.billAnalysis.totalOverageCost, style: { alignment: 'right', fontSize: 9, bold: true } },
            { border: [false, false, true, false], margin: [-5, -2, 0, 0], colSpan: 4,
              text: '---- Cost of energy consumed above Baseline Supply referenced as DEMAND or KVAR',
              style: { fontSize: 7 } }
          ],

          // NOTE row
          [{ border: [true, false, true, false], margin: [10, 5, 10, 20], colSpan: 6,
             text: [{ text: 'NOTE: ', style: { bold: true, decoration: 'underline' } },
               'Provider\'s statement itemizes 3 points of billing, ',
               { text: ' kW, kWh ', style: { bold: true } }, 'and ',
               { text: 'Power Factor/DEMAND/kVAR ', style: { bold: true } },
               'without describing the cause of billing.'],
             style: { fontSize: 8 } }],

          // REFERENCE #2 header
          [
            { border: noBordersCell, margin: [-2, 0, 0, 0], text: 'REFERENCE #2', colSpan: 2,
              style: { color: 'white', fillColor: 'black', bold: true } },
            { border: noBordersCell, text: '' },
            { border: noBordersCell, text: 'Total Charges:',
              style: { alignment: 'right', color: 'white', bold: true, fillColor: 'black' } },
            { border: noBordersCell, text: '', style: { fillColor: 'black' } },
            { border: [false, true, true, false], text: '', colSpan: 2 },
          ],

          ...getAnalysisChargesRows(billData.billAnalysis.reference2Section1Charges),

          // Total charges ref2 section1
          [
            { border: noBordersCell, margin: [-2, 0, 0, 0], text: 'Total Charges: ', colSpan: 2,
              style: { color: 'white', fillColor: 'black', bold: true } },
            { border: noBordersCell, text: '' },
            { border: noBordersCell, text: billData.billAnalysis.totalReference2Section1Charges,
              style: { alignment: 'right', color: 'white', bold: true, fillColor: 'black' } },
            { border: [false, false, true, false], text: '', colSpan: 3 },
          ],

          // NOTE ref2
          [{ border: [true, false, true, false], margin: [10, 5, 10, 20], colSpan: 6,
             text: [{ text: 'NOTE: ', style: { bold: true, decoration: 'underline' } },
               'Provider\'s statement itemizes 3 points of billing that should be understood by the customer.',
               ' It is our concern that the Provider has billed the customer for the ',
               { text: String(billData.billAnalysis.kwhConsumed), style: { bold: true } }, 'kWh.'],
             style: { fontSize: 8 } }],

          // BILL NOTES
          [
            { border: [true, false, false, false], text: 'BILL NOTES:',
              style: { bold: true, alignment: 'right' } },
            { border: noBordersCell, margin: [-5, 0, 0, 0],
              text: [{ text: '1. ', style: { bold: true } }, 'See Tariff'], colSpan: 2 },
            { border: noBordersCell, text: '' },
            { border: noBordersCell, margin: [-5, -3, 0, -3], colSpan: 3,
              table: { widths: [15, '*', '*', '*'], body: [[
                { border: [false, false, true, false], text: 'Calculated Energy Waste from Bill',
                  style: { color: 'white', fillColor: 'black', bold: true, alignment: 'center' }, colSpan: 4 }
              ]] } },
          ],
          [
            { border: [true, false, false, false], text: '(Sourced from Bill. See below)',
              style: { fontSize: 7, alignment: 'center' }, rowSpan: 2 },
            { border: noBordersCell, margin: [-4, 0, 0, 0],
              text: [{ text: '2. ', style: { bold: true } }, 'See Tariff'], colSpan: 2 },
            { border: noBordersCell, text: '' },
            { border: noBordersCell, margin: [-5, -3, 0, -3], colSpan: 3,
              table: { widths: ['*', '*'], body: [[
                { border: [true, false, false, true], text: 'kWh Consumed:',
                  style: { alignment: 'left', bold: true } },
                { border: [false, false, true, true], margin: [-5, 0, 0, 0],
                  text: String(billData.calculatedWaste.kwhConsumed),
                  style: { alignment: 'right', bold: true } },
              ]] } },
          ],
          [
            { border: [true, false, false, false], text: '' },
            { border: noBordersCell, margin: [-4, 0, 0, 0],
              text: [{ text: '3. ', style: { bold: true } }, 'See Tariff'], colSpan: 2 },
            { border: noBordersCell, text: '' },
            { border: noBordersCell, margin: [-5, -3, 0, -3], colSpan: 3,
              table: { widths: ['*', '*'], body: [[
                { text: 'Peak kW: ' + billData.supplySide.billedKw,
                  style: { fillColor: lightGrayBG, alignment: 'center', bold: true } },
                { text: '15-Min kW Avg.: ' + billData.calculatedWaste.Kw15Min,
                  style: { bold: true, alignment: 'right' } },
              ]] } },
          ],
          [
            { border: [true, false, false, false], text: '' },
            { border: noBordersCell, margin: [-4, 0, 0, 0],
              text: [{ text: '4. ', style: { bold: true } }, 'See Tariff'], colSpan: 2 },
            { border: noBordersCell, text: '' },
            { border: noBordersCell, margin: [-5, -3, 0, -3], colSpan: 3,
              table: { widths: [15, '*', '*'], body: [[
                { border: noBordersCell, text: '' },
                { border: [true, false, false, true], text: 'Avg. Amp Draw:',
                  style: { bold: true, alignment: 'right' } },
                { border: [false, false, true, true], margin: [-5, 0, 0, 0],
                  text: billData.calculatedWaste.avgAmpDraw, style: { alignment: 'right', bold: true } },
              ]] } },
          ],

          // Ref 2 section 2 charge rows (0-5)
          [
            { border: [true, false, false, false], text: billData.billAnalysis.reference2Section2Charges[0].name, colSpan: 2 },
            { border: noBordersCell, text: '' },
            { border: noBordersCell, margin: [-5, 0, 0, 0],
              text: billData.billAnalysis.reference2Section2Charges[0].amount, style: { alignment: 'right' } },
            { border: noBordersCell, margin: [-5, -3, 0, -3], colSpan: 3,
              table: { widths: [15, '*', '*'], body: [[
                { border: noBordersCell, text: '' },
                { border: [true, false, false, true], margin: [2, 0, -2, 0], text: 'Load Factor:',
                  style: { alignment: 'right', bold: true } },
                { border: [true, false, false, true], margin: [-5, 0, 0, 0],
                  text: billData.calculatedWaste.powerFactor, style: { alignment: 'right', bold: true } },
              ]] } },
          ],
          [
            { border: [true, false, false, false], text: billData.billAnalysis.reference2Section2Charges[1].name, colSpan: 2 },
            { border: noBordersCell, text: '' },
            { border: noBordersCell, margin: [-5, 0, 0, 0],
              text: billData.billAnalysis.reference2Section2Charges[1].amount, style: { alignment: 'right' } },
            { border: noBordersCell, margin: [-5, -3, 0, -3], colSpan: 3,
              table: { widths: [130, '*'], body: [[
                { border: [true, true, false, true], text: 'Reactive kVAR Supply Waste:',
                  style: { fillColor: lightGrayBG, alignment: 'right', bold: true, fontSize: 7 } },
                { border: [false, false, true, true], margin: [-5, 0, 0, 0],
                  text: billData.calculatedWaste.reactiveKvarWaste,
                  style: { fillColor: lightGrayBG, alignment: 'right', bold: true } },
              ]] } },
          ],
          [
            { border: [true, false, false, false], text: billData.billAnalysis.reference2Section2Charges[2].name, colSpan: 2 },
            { border: noBordersCell, text: '' },
            { border: noBordersCell, margin: [-5, 0, 0, 0],
              text: billData.billAnalysis.reference2Section2Charges[2].amount, style: { alignment: 'right' } },
            { border: noBordersCell, margin: [-5, -3, 0, -3], colSpan: 3,
              table: { widths: [130, '*'], body: [[
                { border: [true, true, false, true], margin: [-5, 0, -5, 0],
                  text: 'Reactive kVAR Supply Waste (Amps):',
                  style: { fillColor: darkGrayBg, color: 'white', alignment: 'right', bold: true, fontSize: 7 } },
                { border: [false, false, true, true], margin: [-5, 0, 0, 0],
                  text: billData.calculatedWaste.reactiveKvarSupplyWasteAmps,
                  style: { fillColor: darkGrayBg, alignment: 'right', color: 'white', bold: true } },
              ]] } },
          ],
          [
            { border: [true, false, false, false], text: billData.billAnalysis.reference2Section2Charges[3].name, colSpan: 2 },
            { border: noBordersCell, text: '' },
            { border: noBordersCell, margin: [-5, 0, 0, 0],
              text: billData.billAnalysis.reference2Section2Charges[3].amount, style: { alignment: 'right' } },
            { border: noBordersCell, margin: [-5, -3, 0, -3], colSpan: 3,
              table: { widths: [30, '*', '*', 35], body: [[
                { border: noBordersCell, text: '' },
                { border: [true, false, true, false], text: 'MONTHLY SAVINGS RECAP',
                  style: { alignment: 'center', bold: true, decoration: 'underline', fontSize: 8 }, colSpan: 3 },
              ]] } },
          ],
          [
            { border: [true, false, false, false], text: billData.billAnalysis.reference2Section2Charges[4].name, colSpan: 2 },
            { border: noBordersCell, text: '' },
            { border: noBordersCell, margin: [-5, 0, 0, 0],
              text: billData.billAnalysis.reference2Section2Charges[4].amount, style: { alignment: 'right' } },
            // ← was [-5,-4,-5,0] — right margin 0 to stop overflow
            { border: noBordersCell, margin: [-5, -4, 0, 0], colSpan: 3,
              table: { widths: [30, '*', '*', 35], body: [[
                { border: noBordersCell, text: '' },
                { border: [true, false, false, false], text: 'Calc\'d Amp Savings:',
                  style: { alignment: 'right', fontSize: 7 } },
                { border: [false, false, true, false], colSpan: 2,
                  text: String(_.round(billData.calculatedWaste.avgAmpDrawNum * billData.baselineSavingsPercent / 100, 2)),
                  style: { alignment: 'right', fontSize: 7, bold: true } },
              ]] } },
          ],
          [
            { border: [true, false, false, false], text: billData.billAnalysis.reference2Section2Charges[5].name, colSpan: 2 },
            { border: noBordersCell, text: '' },
            { border: noBordersCell, margin: [-5, 0, 0, 0],
              text: billData.billAnalysis.reference2Section2Charges[5].amount, style: { alignment: 'right' } },
            // ← was [-5,-6,-5,-3] — right margin 0 to stop overflow
            { border: [false, false, true, false], margin: [-5, -6, 0, -3], colSpan: 3,
              table: { widths: [30, '*', '*', 35], body: [[
                { border: noBordersCell, text: '' },
                { border: [true, false, false, false], text: 'Calc\'d kW Savings:',
                  style: { alignment: 'right', fontSize: 7 } },
                { border: [false, false, true, false], colSpan: 2,
                  text: String(_.round(billData.calculatedWaste.avgAmpDrawNum * billData.baselineSavingsPercent / 100 * 0.48, 2)),
                  style: { alignment: 'right', fontSize: 7, bold: true } },
              ]] } },
          ],

          // Total charges ref2 section2
          [
            { border: [true, false, false, false], margin: [0, -3, 0, -3], text: 'Total Charges: ', colSpan: 2,
              style: { color: 'white', fillColor: 'black' } },
            { border: [false, false, false, true], text: '' },
            { border: [false, false, false, true], margin: [-5, -3, 0, -3],
              text: billData.billAnalysis.totalReference2Section2Charges,
              style: { alignment: 'right', color: 'white', fillColor: 'black' } },
            // ← was [-5,-8,-5,-3] — right margin 0 to stop overflow
            { border: [false, false, true, true], margin: [-5, -8, 0, -3], colSpan: 3,
              table: { widths: [30, '*', '*', 35], body: [[
                { border: noBordersCell, text: '' },
                { margin: [0, 0, 0, -5], border: [true, false, false, false], text: 'Calc\'d kWh Savings:',
                  style: { alignment: 'right', fontSize: 7 } },
                { border: [false, false, true, false], colSpan: 2,
                  text: String(_.round(billData.billAnalysis.kwhConsumed * billData.baselineSavingsPercent / 100, 2)),
                  style: { alignment: 'right', fontSize: 7, bold: true } },
              ]] } },
          ],
        ]
      },
      style: { fontSize: 9 }
    },
  ]
};

const pdfDoc = printer.createPdfKitDocument(docDefinition);
const out = fs.createWriteStream('/tmp/simulate-bill-analytic.pdf');
pdfDoc.pipe(out);
pdfDoc.end();
out.on('finish', () => console.log('PDF written to /tmp/simulate-bill-analytic.pdf'));
out.on('error', (e) => { console.error('Write error:', e); process.exit(1); });
