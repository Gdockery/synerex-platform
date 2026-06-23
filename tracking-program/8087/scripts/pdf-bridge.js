#!/usr/bin/env node
/**
 * PDF Bridge - generates full PDF layouts for Flask.
 * Call from Flask when PDF_BRIDGE_PATH is set.
 * Usage: node scripts/pdf-bridge.js <documentKind> [options...]
 *   Reads JSON data from stdin, writes PDF to stdout.
 *   Or: --output=path to write to file.
 *
 * Document kinds: billAnalytic, costSavings, lsPotential, co2Savings,
 *   partsProcurement, shippingDocuments, financeAgreement
 */
const fs = require('fs');
const path = require('path');

const _ = require('lodash');
global._ = _;
const PdfPrinter = require('pdfmake/src/printer');

const fonts = {
  Roboto: {
    normal: path.join(__dirname, '../api/services/pdf/resources/fonts/Open_Sans/OpenSans-Regular.ttf'),
    bold: path.join(__dirname, '../api/services/pdf/resources/fonts/Open_Sans/OpenSans-Bold.ttf'),
    italics: path.join(__dirname, '../api/services/pdf/resources/fonts/Open_Sans/OpenSans-Italic.ttf'),
    bolditalics: path.join(__dirname, '../api/services/pdf/resources/fonts/Open_Sans/OpenSans-LightItalic.ttf'),
  },
};
const printer = new PdfPrinter(fonts);

const resourceBase = path.join(__dirname, '../api/services/pdf/resources');

function resolvePath(name) {
  const p = path.join(resourceBase, name);
  return fs.existsSync(p) ? p : null;
}

const generators = {
  billAnalytic: require('../api/services/pdf/generators/bill-analytic.js')(printer),
  proposal: require('../api/services/pdf/generators/client-proposal.js')(printer),
  costSavings: require('../api/services/pdf/generators/monthly-energy-savings.js')(printer),
  lsPotential: require('../api/services/pdf/generators/ls-potential.js')(printer),
  co2Savings: require('../api/services/pdf/generators/co2.js')(printer),
  partsProcurement: require('../api/services/pdf/generators/parts-procurement.js')(printer),
  shippingDocuments: require('../api/services/pdf/generators/shipping-documents.js')(printer),
  financeAgreement: require('../api/services/pdf/generators/finance-agreement.js')(printer),
};

function main() {
  const kind = process.argv[2];
  const outputPath = process.argv.find(a => a.startsWith('--output='))?.split('=')[1];
  if (!kind || !generators[kind]) {
    console.error('Usage: node pdf-bridge.js <documentKind> [--output=path]');
    console.error('Kinds:', Object.keys(generators).join(', '));
    process.exit(1);
  }
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { input += chunk; });
  process.stdin.on('end', () => {
    let data, paths = {};
    try {
      const parsed = JSON.parse(input || '{}');
      data = parsed.data || parsed;
      paths = parsed.paths || {};
    } catch (e) {
      console.error('Invalid JSON input:', e.message);
      process.exit(1);
    }
    // Debug: dump full payload to disk so layout issues can be reproduced offline
    if (kind === 'billAnalytic') {
      try {
        const dumpPath = path.join(__dirname, '../.tmp/pdf_debug_payload.json');
        fs.mkdirSync(path.dirname(dumpPath), { recursive: true });
        fs.writeFileSync(dumpPath, JSON.stringify({ data, paths }, null, 2));
      } catch (_) {}
    }
    const gen = generators[kind];
    let logoPath = paths.logo || resolvePath('logo.png');
    let coverPath = paths.cover || resolvePath('bill-cover.png');
    let stream;
    try {
      switch (kind) {
        case 'billAnalytic':
          stream = gen.generate(data, coverPath || logoPath, logoPath, paths.exclusive || resolvePath('exclusive.png'), data.brandName || 'Synerex');
          break;
        case 'proposal':
          stream = gen.generate(
            data,
            paths.cover      || resolvePath('proposal-cover.png') || coverPath,
            logoPath,
            paths.indexLogo  || resolvePath('synerex-logo-white.png') || resolvePath('index-logo.png') || logoPath,
            paths.calcEnergy || resolvePath('calculated-energy-savings.png'),
            paths.effGains   || resolvePath('efficiency-gains.png'),
            paths.redCurve   || resolvePath('advancing-red-curve.png'),
            paths.elecBill   || resolvePath('electric-service-bill.png'),
            paths.calc       || resolvePath('calculation.png'),
            paths.pmEngineers|| resolvePath('project-managers-engineers.png'),
            paths.etlLogo    || resolvePath('etl-logo.png'),
            paths.clients    || resolvePath('synerex-clients.png'),
            paths.installMap || resolvePath('installation-map.png'),
            paths.insurance  || resolvePath('insurance-coverage.png'),
            paths.signature  || resolvePath('signature.png'),
            paths.pqComp     || resolvePath('power-quality-comparison.png'),
            paths.pqWith     || resolvePath('power-quality-with-synerex.png'),
            paths.pqWithout  || resolvePath('power-quality-without-synerex.png'),
            paths.portal     || resolvePath('synerex-realtime-portal.png'),
            paths.pqImprove  || resolvePath('power-quality-improvement.png'),
            paths.pqCost     || resolvePath('power-quality-cost.png'),
            data.brandName   || 'Synerex'
          );
          break;
        case 'costSavings':
        case 'lsPotential':
          stream = gen.generate(data, logoPath);
          break;
        case 'co2Savings':
          stream = gen.generate(data, logoPath, paths.head || resolvePath('head.png'),
            paths.graph || resolvePath('graph.png'), paths.energy || resolvePath('energy.png'),
            paths.graphic || resolvePath('graphic.png'));
          break;
        case 'partsProcurement':
          stream = gen.generate(data, paths.graph || resolvePath('parts-procurement-graph.png'), data.brandName || 'Synerex');
          break;
        case 'shippingDocuments':
          stream = gen.generate(data, logoPath);
          break;
        case 'financeAgreement':
          stream = gen.generate(data, logoPath);
          break;
        default:
          throw new Error('Unknown kind: ' + kind);
      }
      stream.end();
      if (outputPath) {
        const w = fs.createWriteStream(outputPath);
        stream.pipe(w);
        w.on('finish', () => process.exit(0));
        w.on('error', err => { console.error(err); process.exit(1); });
      } else {
        stream.pipe(process.stdout);
      }
    } catch (err) {
      console.error('PDF generation failed:', err.message);
      process.exit(1);
    }
  });
}

main();
