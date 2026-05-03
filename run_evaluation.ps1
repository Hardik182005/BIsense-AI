Write-Host '==========================================' -ForegroundColor Cyan
Write-Host '   BISense AI — Automated Evaluation' -ForegroundColor Cyan
Write-Host '==========================================' -ForegroundColor Cyan
Write-Host ''
Write-Host '[+] Step 1: Running Inference...' -ForegroundColor Yellow
python inference.py --input data/public_test_set.json --output data/results.json
Write-Host ''
Write-Host '[+] Step 2: Calculating Metrics...' -ForegroundColor Yellow
python eval_script.py --results data/results.json --input data/public_test_set.json
Write-Host ''
Write-Host '[+] Evaluation Complete.' -ForegroundColor Green
