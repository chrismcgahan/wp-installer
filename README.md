# wp-installer
This is a node script to setup WordPress sites on your Ubuntu server. It's in the very early stages.

To use it you must install Node and WP-CLI (https://make.wordpress.org/cli/handbook/installing/)

To configure, copy config-sample to config and edit the files inside the config directory.

##Setup on Ubuntu

###Install Node
```
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
```

###Install Yarn
```
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update && sudo apt-get install yarn
```

###Run yarn
```
cd wp-installer
yarn
```

###Configure
```
cp -r config-sample config
```

Edit files in config directory to provide database access and change default settings.
