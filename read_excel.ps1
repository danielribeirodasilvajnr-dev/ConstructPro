$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$wb = $excel.Workbooks.Open("D:\Downloads\Planilha PCI.xlsm")
$ws = $wb.Sheets.Item("Proposta_Constr_Individual")

Write-Host "=== MAPEAMENTO DE CELULAS (Linhas 25-70) ==="
for ($row = 25; $row -le 70; $row++) {
    for ($col = 1; $col -le 60; $col++) {
        $val = $ws.Cells.Item($row, $col).Text
        if ($val -and $val.Trim() -ne "") {
            $addr = $ws.Cells.Item($row, $col).Address($false, $false)
            Write-Host "${addr} = ${val}"
        }
    }
}

$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
