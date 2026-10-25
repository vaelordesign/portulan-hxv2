# Exporte chaque diapo des pptx de sources/ en PNG dans img/<nom>/NN.png (PowerPoint COM)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ppt = New-Object -ComObject PowerPoint.Application
Get-ChildItem "$root\sources\*.pptx" | ForEach-Object {
  $name = $_.BaseName
  $out = Join-Path $root "img\$name"
  New-Item -ItemType Directory -Force $out | Out-Null
  $pres = $ppt.Presentations.Open($_.FullName, $true, $false, $false)
  foreach ($s in $pres.Slides) {
    $f = Join-Path $out ("{0:D2}.png" -f $s.SlideIndex)
    $s.Export($f, "PNG", 960, 540)
  }
  Write-Output "$name : $($pres.Slides.Count) diapos"
  $pres.Close()
}
$ppt.Quit()
