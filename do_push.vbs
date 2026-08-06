Set oShell = CreateObject("WScript.Shell")
Set oExec = oShell.Exec("git -C ""C:\Users\Ymk159\Desktop\yamaka-app"" push origin HEAD:main 2>&1")
Dim output
output = oExec.StdOut.ReadAll()
If output = "" Then output = "(no output - check stderr)"
MsgBox output, 0, "Git Push Result"
