### Parse your ES6 imports and convert them into a Metamaps map

This will look for .js files in the Metamaps/ directory of this folder. Then it'll parse the imports, and split them into internal and external ones. Each import will be put into a CSV under "Topics". Then it'll create synapses between all the files based on their imports.

Import the CSV into Metamaps and you can untangle the dependencies from there to help refactor your code.

To run:

```
npm start
```
