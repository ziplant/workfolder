# workfolder

Simple gulp bulder using pug, sass, babel, webpack

## Install 
```cli
npm install workfolder -g
```

## Usage
To create the project directory enter the following command:
```cli
workfolder create <name>
```

You have the following npm scripts:
```json
"start": "cross-env NODE_ENV=development gulp start",
"build": "cross-env NODE_ENV=production gulp build",
"example-component": "gulp addcomp -n example"
```
So to create new component enter:
```json
gulp addcomp -n <name>
```