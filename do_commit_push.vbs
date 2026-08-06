Set oShell = CreateObject("WScript.Shell")
oShell.CurrentDirectory = "C:\Users\Ymk159\Desktop\yamaka-app"

' Delete lock file if exists
oShell.Run "cmd /c del /f "".git\index.lock"" 2>nul", 0, True

' git add
Set oExec = oShell.Exec("git add index.html styles.css")
oExec.StdOut.ReadAll()

' git commit
Set oExec = oShell.Exec("git commit -m ""タイムアタックランキング追加（60秒・5分）""")
Dim commitOut
commitOut = oExec.StdOut.ReadAll()

' git push
Set oExec = oShell.Exec("git push origin HEAD:main")
Dim pushOut
pushOut = oExec.StdOut.ReadAll() & oExec.StdErr.ReadAll()

MsgBox "Commit: " & commitOut & Chr(10) & "Push: " & pushOut, 0, "Git Result"
