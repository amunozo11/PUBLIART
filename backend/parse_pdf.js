const fs = require('fs');
const pdf = require('pdf-parse');
pdf(fs.readFileSync('C:/Users/Alex/Desktop/PUBLIART/frontend/public/cotizacion-ejemplo.pdf')).then(data => console.log(data.text));
