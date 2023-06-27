const XLSX = require("xlsx")

async function readFile(fileName) {
    const workbook = XLSX.readFile(fileName)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    const columnNames = jsonData[0]

    const data = []

    for (let i = 1; i < jsonData.length; i++) {
        const rowData = jsonData[i]
        const obj = {}

        for (let j = 0; j < columnNames.length; j++) {
            const columnName = columnNames[j]
            obj[columnName] = rowData[j]
        }

        data.push(obj)
    }

    return data
}

module.exports = readFile