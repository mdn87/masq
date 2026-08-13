# Repository Bootstrap

Create `mdn87/masque` as an empty GitHub repository. Do not add a generated README, license, or `.gitignore`, because the seed already contains them.

## PowerShell

From the directory containing the extracted `masque` folder:

```powershell
cd .\masque
git init
git branch -M main
git remote add origin git@github.com:mdn87/masque.git
npm test
git add .
git commit -m "feat: seed masque persona framework"
git push -u origin main
```

Use the HTTPS remote instead when SSH authentication is not configured:

```powershell
git remote set-url origin https://github.com/mdn87/masque.git
```

## Local Plugin Test

```powershell
claude --plugin-dir .
```

Then test the initial profiles:

```text
/masque:persona list
/masque:persona on renfaire
/masque:persona set afterdark:suggestive renfaire:pageant
/masque:persona clear
```

## Install from the Repository

```powershell
claude plugin marketplace add mdn87/masque
claude plugin install masque@masque
```
