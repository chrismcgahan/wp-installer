#!/usr/bin/env node

"use strict"

const co = require('co')
const fs = require('fs')
const readline = require('readline')
const execSync = require('child_process').execSync
const generator = require('generate-password')
const ip = require("ip");

let dbConfig = require('./config/db-config.js')
let defaults = require('./config/defaults.js')

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

co(function* () {
    let isRoot = process.getuid && process.getuid() === 0
    
    if (! isRoot) {
        throw 'You must run this command as root or using sudo.'
    }
    
    let questions = {
        siteUrl    : 'Please enter the site url:',
        siteTitle  : 'Please enter the site title:',
        adminUser  : 'Please enter the admin username:',
        adminPass  : 'Please enter the admin password:',
        adminEmail : 'Please enter the admin email:'
    }
    
    let answers = {}
    
    for (let key in questions) {
        let question = questions[key]
        
        if (defaults[key]) {
            question += ' [' + defaults[key] + ']'
        }
        
        answers[key] = (yield askQuestion(question)) || defaults[key]
    }
    
    rl.close()
    
    
    // start wordpress setup
    let parts = answers.siteUrl.split('.')
    let siteName = parts.pop() === 'com' ? parts.join('.') : answers.siteUrl
    
    let sitePath = '/var/www/' + siteName
    let configFileName = siteName + '.conf'
    let configFilePath = '/etc/apache2/sites-available/' + configFileName
    
    let dbName = answers.siteUrl.split('.').shift()
    let dbUser = dbName.substr(0, 16)
    let dbPass = generator.generate({
        length: 10,
        numbers: true
    })
    
    if (fs.existsSync(sitePath) || fs.existsSync(configFilePath)) {
        throw 'This site already exists.'
    }
    
    let dbList = execSync('mysql -sN --user=' + dbConfig.dbUser + ' --password=' + dbConfig.dbPass + ' -e "SHOW DATABASES"').toString().split("\n")
    
    if (dbList.indexOf(dbName) !== -1) {
        throw 'Database already exists.'
    }
    
    let confString = fs.readFileSync(__dirname + '/config/site-config.conf').toString()
    
    let replacements = {
        siteUrl  : answers.siteUrl,
        siteName : siteName
    }
    
    for (let key in replacements) {
        confString = confString.replace(new RegExp('{{' + key + '}}', 'g'), replacements[key])
    }
    
    fs.writeFileSync(configFilePath, confString)
    
    execSync('a2ensite ' + configFileName)
    
    execSync('mysql --user=' + dbConfig.dbUser + ' --password=' + dbConfig.dbPass + ' -e "GRANT ALL ON ' + dbName + '.* TO \'' + dbUser + '\'@\'localhost\' IDENTIFIED BY \'' + dbPass + '\';"')
    
    execSync('wp core download --allow-root --path=' + sitePath)
    execSync('wp core config --allow-root --dbname=' + dbName + ' --dbuser=' + dbUser + ' --dbpass=\'' + dbPass + '\' --path=' + sitePath)
    execSync('wp db create --allow-root --path=' + sitePath)
    execSync('wp core install --allow-root --url=' + answers.siteUrl + ' --title="' + answers.siteTitle + '" --admin_user=' + answers.adminUser + ' --admin_password="' + answers.adminPass + '" --admin_email=' + answers.adminEmail + ' --path=' + sitePath)
 
    execSync('chown -R www-data:www-data ' + sitePath)
    
    execSync('service apache2 reload')
    
    console.log('Setup complete. Please point ' + answers.siteUrl + ' to ' + ip.address())
}).catch(error => {
    if (typeof error === 'string') {
        console.log(error)
    }
    else {
        console.log(error.stack)
    }
    
    rl.close()
})


function askQuestion(question) {
    return new Promise((resolve, reject) => {
        rl.question(question + "\n", (answer) => {
            resolve(answer)
        })
    })
}
