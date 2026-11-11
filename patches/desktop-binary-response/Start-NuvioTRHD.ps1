param([switch]$CheckOnly)

$ErrorActionPreference = 'Stop'
$taskExe = Join-Path $PSScriptRoot 'Nuvio TR HD.exe'
$taskJar = Join-Path $PSScriptRoot 'app\composeApp-desktop-http-fixed.jar'
$taskCfg = Join-Path $PSScriptRoot 'app\Nuvio TR HD.cfg'
$taskExpectedHash = '0602C8471D075842341AC91EBBB417EB471C25240806FB62792B00679C0AD6CD'

function Write-LaunchState([string]$State) {
    try {
        [pscustomobject]@{ checkedAt = [DateTime]::UtcNow.ToString('o'); state = $State } |
            ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'launcher-status.json') -Encoding UTF8
    } catch { }
}

function Get-OtherNuvio {
    @(Get-CimInstance Win32_Process -Filter "name='Nuvio.exe' OR name='Nuvio TR HD.exe'" |
        Where-Object { $_.ExecutablePath -and $_.ExecutablePath -ne $taskExe })
}

try {
    if (!(Test-Path -LiteralPath $taskExe) -or !(Test-Path -LiteralPath $taskCfg)) {
        throw 'Duzeltilmis uygulama dosyalari eksik.'
    }
    if ((Get-FileHash -LiteralPath $taskJar -Algorithm SHA256).Hash -ne $taskExpectedHash) {
        throw 'Duzeltilmis uygulamanin dosya kontrolu basarisiz.'
    }
    $taskFirstClasspath = Get-Content -LiteralPath $taskCfg |
        Where-Object { $_ -like 'app.classpath=*' } | Select-Object -First 1
    if ($taskFirstClasspath -ne 'app.classpath=$APPDIR\composeApp-desktop-http-fixed.jar') {
        throw 'Duzeltilmis uygulamanin acilis ayari gecersiz.'
    }
    $taskOther = @(Get-OtherNuvio)
    if ($CheckOnly) {
        [pscustomobject]@{ PackageValid = $true; OtherProcesses = $taskOther.Count; StartsApplication = $false }
        return
    }
    Add-Type -AssemblyName System.Windows.Forms
    Write-LaunchState 'validated'
    if ($taskOther.Count) {
        $taskAnswer = [System.Windows.Forms.MessageBox]::Show(
            'Eski Nuvio kopyasi acik. Tamam ile onu normal sekilde kapatip duzeltilmis Nuvio TR HD acilacak. Oynatma veya indirme varsa once bitmesini bekleyin.',
            'Nuvio TR HD - duzeltilmis Windows kopyasi',
            [System.Windows.Forms.MessageBoxButtons]::OKCancel,
            [System.Windows.Forms.MessageBoxIcon]::Information)
        if ($taskAnswer -ne [System.Windows.Forms.DialogResult]::OK) {
            Write-LaunchState 'cancelled'
            return
        }
        Write-LaunchState 'closing-other-copy'
        foreach ($taskItem in $taskOther) {
            $taskProcess = Get-Process -Id $taskItem.ProcessId -ErrorAction SilentlyContinue
            if ($taskProcess -and $taskProcess.MainWindowHandle -ne 0) {
                $null = $taskProcess.CloseMainWindow()
            }
        }
        $taskDeadline = [DateTime]::UtcNow.AddSeconds(10)
        while (@(Get-OtherNuvio).Count -and [DateTime]::UtcNow -lt $taskDeadline) {
            Start-Sleep -Milliseconds 250
        }
        if (@(Get-OtherNuvio).Count) {
            throw 'Eski Nuvio kapanmadi. Uygulamayi tamamen kapatip bu kisayolu yeniden acin. Zorla kapatma yapilmadi.'
        }
    }
    $taskExistingFixed = @(Get-CimInstance Win32_Process -Filter "name='Nuvio TR HD.exe'" |
        Where-Object { $_.ExecutablePath -eq $taskExe })
    if ($taskExistingFixed.Count) {
        Write-LaunchState 'fixed-copy-already-running'
        [System.Windows.Forms.MessageBox]::Show('Duzeltilmis Nuvio TR HD zaten acik. Gorev cubugundaki penceresine gecin.', 'Nuvio TR HD') | Out-Null
        return
    }
    Start-Process -FilePath $taskExe -WorkingDirectory $PSScriptRoot
    Write-LaunchState 'fixed-copy-start-requested'
} catch {
    if ($CheckOnly) { throw }
    Write-LaunchState 'failed'
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Nuvio TR HD acilamadi') | Out-Null
    exit 1
}
