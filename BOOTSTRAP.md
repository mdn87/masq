# Repository Bootstrap

Create `mdn87/masq` as an empty GitHub repository. Do not add a generated README, license, or `.gitignore`, because the seed already contains them.

## PowerShell

From the directory containing the extracted `masq` folder:

```powershell
cd .\masq
git init
git branch -M main
git remote add origin git@github.com:mdn87/masq.git
npm test
git add .
git commit -m "feat: seed masq persona framework"
git push -u origin main
```

Use the HTTPS remote instead when SSH authentication is not configured:

```powershell
git remote set-url origin https://github.com/mdn87/masq.git
```

## Local Plugin Test

```powershell
claude --plugin-dir .
```

Then test the initial profiles:

```text
/masq:persona list
/masq:persona on renfaire
/masq:persona set afterdark:suggestive renfaire:pageant
/masq:persona clear
```

## Install from the Repository

```powershell
claude plugin marketplace add mdn87/masq
claude plugin install masq@masq
```
