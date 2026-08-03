// Minimal, dependency-free XLSX reader/writer for the simple tabular admin templates.
const encoder = new TextEncoder()
const decoder = new TextDecoder()

export async function createXlsx(sheetName: string, rows: string[][]) { return createXlsxWorkbook([{ name: sheetName, rows }]) }

export async function createXlsxWorkbook(sheets: Array<{ name: string; rows: string[][] }>) {
  if (!sheets.length) throw new Error('At least one worksheet is required.')
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': bytes(`<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_,index)=>`<Override PartName="/xl/worksheets/sheet${index+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`),
    '_rels/.rels': bytes(`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    'xl/workbook.xml': bytes(`<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((sheet,index)=>`<sheet name="${xml(sheet.name)}" sheetId="${index+1}" r:id="rId${index+1}"/>`).join('')}</sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': bytes(`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,index)=>`<Relationship Id="rId${index+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index+1}.xml"/>`).join('')}</Relationships>`),
  }
  sheets.forEach((sheet,index) => { files[`xl/worksheets/sheet${index+1}.xml`] = worksheet(sheet.rows) })
  return zip(files)
}

export async function readXlsx(file: File) {
  const workbook = await readXlsxWorkbook(file)
  const first = Object.values(workbook)[0]
  if (!first) throw new Error('The workbook has no data worksheets.')
  return first
}

export async function readSpreadsheet(file: File) {
  if (file.name.toLowerCase().endsWith('.csv')) return readCsv(await file.text())
  return readXlsx(file)
}

export function readCsv(value: string) {
  const rows: string[][] = []
  let row: string[] = [], field = '', quoted = false
  const input = value.replace(/^\uFEFF/, '')
  for (let index = 0; index < input.length; index++) {
    const char = input[index]
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') { field += '"'; index++ }
      else if (char === '"') quoted = false
      else field += char
    } else if (char === '"') quoted = true
    else if (char === ',') { row.push(field); field = '' }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[index + 1] === '\n') index++
      row.push(field); rows.push(row); row = []; field = ''
    } else field += char
  }
  if (quoted) throw new Error('Invalid CSV: a quoted field is not closed.')
  if (field || row.length) { row.push(field); rows.push(row) }
  const populated = rows.filter(values => values.some(cell => cell.trim()))
  if (!populated.length) throw new Error('The CSV file is empty.')
  const headers = populated[0].map(header => header.trim())
  if (headers.some(header => !header)) throw new Error('The CSV header contains an empty column name.')
  return populated.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ''])))
}

export async function readXlsxWorkbook(file: File) {
  const files = await unzip(new Uint8Array(await file.arrayBuffer()))
  const workbookBytes = files.get('xl/workbook.xml'), relationshipBytes = files.get('xl/_rels/workbook.xml.rels')
  if (!workbookBytes || !relationshipBytes) throw new Error('The workbook structure is incomplete.')
  const sharedDoc = files.get('xl/sharedStrings.xml') ? parse(decoder.decode(files.get('xl/sharedStrings.xml')!)) : null
  const shared = sharedDoc ? [...sharedDoc.getElementsByTagNameNS('*', 'si')].map(node => [...node.getElementsByTagNameNS('*', 't')].map(t => t.textContent ?? '').join('')) : []
  const workbookDoc=parse(decoder.decode(workbookBytes)), relationshipDoc=parse(decoder.decode(relationshipBytes))
  const targets=new Map([...relationshipDoc.getElementsByTagNameNS('*','Relationship')].map(node=>[node.getAttribute('Id')??'',node.getAttribute('Target')??'']))
  const result: Record<string, Record<string,string>[]> = {}
  for (const node of [...workbookDoc.getElementsByTagNameNS('*','sheet')]) {
    const name=node.getAttribute('name')??'', relationId=node.getAttribute('r:id')??node.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')??''
    const target=targets.get(relationId); if(!target) continue
    const path=target.startsWith('/')?target.slice(1):`xl/${target.replace(/^\.\//,'')}`
    const sheet=files.get(path); if(sheet) result[name]=readSheet(sheet,shared)
  }
  return result
}

function readSheet(sheet: Uint8Array, shared: string[]) {
  const doc = parse(decoder.decode(sheet))
  const rows = [...doc.getElementsByTagNameNS('*', 'row')].map(row => {
    const result: string[] = []
    for (const cell of [...row.getElementsByTagNameNS('*', 'c')]) {
      const ref = cell.getAttribute('r') ?? 'A1'
      const index = [...ref.match(/^[A-Z]+/)![0]].reduce((n, char) => n * 26 + char.charCodeAt(0) - 64, 0) - 1
      const raw = cell.getElementsByTagNameNS('*', 'v')[0]?.textContent ?? cell.getElementsByTagNameNS('*', 't')[0]?.textContent ?? ''
      result[index] = cell.getAttribute('t') === 's' ? shared[Number(raw)] ?? '' : raw
    }
    return result
  })
  if (!rows.length) return []
  return rows.slice(1).filter(row => row.some(Boolean)).map(row => Object.fromEntries(rows[0].map((header, index) => [header, row[index] ?? ''])))
}

function bytes(value: string) { return encoder.encode(value) }
function xml(value: string) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
function parse(value: string) { const doc = new DOMParser().parseFromString(value, 'application/xml'); if (doc.querySelector('parsererror')) throw new Error('Invalid Excel workbook XML.'); return doc }
function column(index: number) { let value = ''; for (index++; index; index = Math.floor((index - 1) / 26)) value = String.fromCharCode(65 + (index - 1) % 26) + value; return value }
function worksheet(rows: string[][]) { return bytes(`<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row, ri) => `<row r="${ri + 1}">${row.map((value, ci) => `<c r="${column(ci)}${ri + 1}" t="inlineStr"><is><t>${xml(value)}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`) }
function crc32(data: Uint8Array) { let crc = -1; for (const byte of data) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)) } return (crc ^ -1) >>> 0 }
function zip(files: Record<string, Uint8Array>) {
  const chunks: Uint8Array[] = [], central: Uint8Array[] = []; let offset = 0
  for (const [name, data] of Object.entries(files)) { const nameBytes = bytes(name), crc = crc32(data); const local = record(0x04034b50, [20,0,0,0,0,crc,data.length,data.length,nameBytes.length,0], [2,2,2,2,2,4,4,4,2,2]); chunks.push(local,nameBytes,data); const center = record(0x02014b50,[20,20,0,0,0,0,crc,data.length,data.length,nameBytes.length,0,0,0,0,0,offset],[2,2,2,2,2,2,4,4,4,2,2,2,2,2,4,4]); central.push(center,nameBytes); offset += local.length + nameBytes.length + data.length }
  const centerSize = central.reduce((n,c)=>n+c.length,0), count=Object.keys(files).length
  const parts = [...chunks, ...central, record(0x06054b50,[0,0,count,count,centerSize,offset,0],[2,2,2,2,4,4,2])].map(part => new Uint8Array(part).buffer as ArrayBuffer)
  return new Blob(parts, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
function record(signature: number, values: number[], sizes: number[]) { const out=new Uint8Array(4+sizes.reduce((a,b)=>a+b,0)), view=new DataView(out.buffer); view.setUint32(0,signature,true); let at=4; values.forEach((value,i)=>{ sizes[i]===2?view.setUint16(at,value,true):view.setUint32(at,value,true);at+=sizes[i] }); return out }
async function unzip(data: Uint8Array) {
  const files=new Map<string,Uint8Array>(); let at=0
  while (new DataView(data.buffer,data.byteOffset+at,4).getUint32(0,true)===0x04034b50) { const view=new DataView(data.buffer,data.byteOffset+at), method=view.getUint16(8,true), size=view.getUint32(18,true), nameLength=view.getUint16(26,true), extraLength=view.getUint16(28,true), name=decoder.decode(data.slice(at+30,at+30+nameLength)), start=at+30+nameLength+extraLength, compressed=data.slice(start,start+size); files.set(name, method===0?compressed:await inflate(compressed)); at=start+size }
  return files
}
async function inflate(data: Uint8Array) { const stream=new Blob([new Uint8Array(data).buffer as ArrayBuffer]).stream().pipeThrough(new DecompressionStream('deflate-raw')); return new Uint8Array(await new Response(stream).arrayBuffer()) }
