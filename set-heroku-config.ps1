# Read the .env file
Get-Content .env | ForEach-Object {
    # Skip empty lines and comments
    if ($_ -match "^\s*#" -or $_ -match "^\s*$") {
        return
    }
    # Set the variable in Heroku
    heroku config:set $_
}