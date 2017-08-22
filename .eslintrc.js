module.exports = {   
    "extends": "airbnb", 
    "parserOptions": {
      "sourceType": "script"
    },
    "env": {
      "node": true,
      "es6": true,
      "browser": true
    },  
    "rules": {
      "no-console": 0,
      "func-names": ["error", "never"],
      "no-use-before-define": ["error", { 
        "functions": false, 
        "classes": true, 
        "variables": true
      }],
      "strict": [2, "global"],
      "jsx-a11y/href-no-hash": 0
    }
  }