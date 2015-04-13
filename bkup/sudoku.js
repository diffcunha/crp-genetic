var _ = require('lodash');
var colors = require('colors/safe');

var Genetic = require('../lib/index.js');

function fitness(vars, context) {

  function getLine(line) {
    var res = [];
    for(var i = 0; i < 3; i++) {
      for(var j = 0; j < 3; j++) {
        res.push(vars[i + (3 * Math.floor(line / 3))][j + (3 * (line % 3))]);
      }
    }
    return res;
  }

  function getColumn(column) {
    var res = [];
    for(var i = 0; i < 3; i++) {
      for(var j = 0; j < 3; j++) {
        res.push(vars[(i * 3) + Math.floor(column / 3)][(j * 3) + (column % 3)])
      }
    }
    return res;
  }

  function sum(arr) {
    return arr.reduce(function(previous, current) {
      return previous + current;
    });
  }

  function prod(arr) {
    return arr.reduce(function(previous, current) {
      return previous * current;
    });
  }

  function g1(arr) {
    return Math.abs(45 - sum(arr));
  }

  function g2(arr) {
    return Math.abs(362880 - prod(arr));
  }

  function g3(arr) {
    return [1,2,3,4,5,6,7,8,9].filter(function(item, index, array) {
      return arr.indexOf(item) === -1;
    }).length 
  }

  function aa(fn1, fn2) {
    return [0,1,2,3,4,5,6,7,8].map(function(elem) {
      return fn1(fn2(elem));
    });
  }

  function aa2(fn1, fn2) {
    return [0,1,2,3,4,5,6,7,8].map(function(elem) {
      return Math.sqrt(fn1(fn2(elem)));
    });
  }

  // var result = 10 * (sum(aa(g1, getLine)) + sum(aa(g1, getColumn))) 
  //     + sum(aa2(g2, getLine)) + sum(aa2(g2, getColumn)) 
  //     + 50 * (sum(aa(g3, getLine)) + sum(aa(g3, getColumn)));

  var colR = [];
  var linR = [];
  for(var j = 0; j < 9; j++) {
    colR.push(g3(getColumn(j)));
    linR.push(g3(getLine(j)));
  }

  var result = sum(colR) + sum(linR);

  return -result;
}

function crossover(mother, father, child1, child2) {
  var pivot1 = randomBetween(1, mother.length-2);
  // var pivot2 = randomBetween(pivot1, mother.length-1);
  for(var i = 0; i < pivot1; i++) {
    child1[i] = mother[i].slice();
    child2[i] = father[i].slice();
  }
  for(var i = pivot1; i < mother.length; i++) {
    child1[i] = father[i].slice();
    child2[i] = mother[i].slice();
  }
  // for(var i = 0; i < mother.length; i++) {
  //   child1[i] = mother[i].slice();
  //   child2[i] = father[i].slice();
  // }
}

function mutate(genome, context) {
  var block = randomBetween(0, genome.length-1);
  var gene = genome[block];

  var rand = Math.random();
  if(rand < 0.6) {
    swap();
  } else {
    swap3();
  } 

  function swap() {
    var i, j, k;
    do {
      i = randomBetween(0, 8);
    } while(context[block][i] !== 0);
    do {
      j = randomBetween(0, 8);
    } while(j != i && context[block][j] !== 0);

    var tmp = gene[j];
    gene[j] = gene[i];
    gene[i] = tmp;
  }

  // 3 swap mutation
  function swap3() {
    var i, j, k;
    do {
      i = randomBetween(0, 8);
    } while(context[block][i] !== 0);
    do {
      j = randomBetween(0, 8);
    } while(j != i && context[block][j] !== 0);
    do {
      k = randomBetween(0, 8);
    } while(k != i && k != j && context[block][k] !== 0);

    var tmp = gene[k];
    gene[k] = gene[j];
    gene[j] = gene[i];
    gene[i] = tmp;
  }
}

// --

var sudoku = [
  [4,8,7,0,5,0,0,6,0],
  [9,0,0,4,0,0,0,0,3],
  [2,0,6,0,8,9,5,0,0],
  [0,0,4,0,1,5,6,0,0],
  [1,0,0,0,0,4,0,5,0],
  [0,7,8,2,0,0,0,0,0],
  [0,0,0,0,0,8,0,7,0],
  [7,5,0,0,0,0,0,3,0],
  [0,2,0,0,3,7,4,1,0]];

function getLine(vars, line) {
  var res = [];
  for(var i = 0; i < 3; i++) {
    for(var j = 0; j < 3; j++) {
      res.push(vars[i + (3 * Math.floor(line / 3))][j + (3 * (line % 3))]);
    }
  }
  return res;
}

function getColumn(vars, column) {
  var res = [];
  for(var i = 0; i < 3; i++) {
    for(var j = 0; j < 3; j++) {
      res.push(vars[(i * 3) + Math.floor(column / 3)][(j * 3) + (column % 3)])
    }
  }
  return res;
}

function getSquare(sudoku, square) {
  var res = [];
  var line = Math.floor(square / 3) * 3;
  for(var i = line; i < line + 3; i++) {
    var column = (square % 3) * 3;
    for(var j = column; j < column + 3; j++) {
      res.push(sudoku[i][j]);
    }
  }
  return res;
}

var original = [];
for(var i = 0; i < 9; i++) {
  original.push(getSquare(sudoku, i));
}

var genome = [];
for(var i = 0; i < 9; i++) {
  var square = getSquare(sudoku, i);
  var diff = _.difference([1,2,3,4,5,6,7,8,9], square);
  genome.push(square.map(function(elem) {
    if(elem === 0) return diff.pop();
    return elem;
  }));
}


function print(original, sudoku) {
  var result = '';
  for(var i = 0; i < 8; i++) {
    for(var j = 0; j < 8; j++) {
      var num = sudoku[i][j];
      var line = getLine(original, i);
      var column = getColumn(original, j);
      if(line.filter(function(elem) { elem == num }).length > 1 || column.filter(function(elem) { elem == num }).length > 1) {
        result += colors.red(num);
      } else {
        result += colors.green(num);
      }
      result += ' ';
    }
    result += '\n';
  }
  return result;
}

var genetic = new Genetic('369dbb2e-00dc-46e0-8fe8-ed81ce4060ac', { 
  mock: false,
  nIndividuals: 40,
  isolationTime: 1000,
  constMutationPercent: 0.9,
  constMatePercent: 0.49,
  constMatingPopulationPercent: 0.7
});

genetic.genome(genome);
genetic.fitness(fitness);

genetic.crossover(crossover);
genetic.mutate(mutate);

genetic.run(original, function(result) {
  console.log(result);
  var normal = [];
  for(var i = 0; i < 8; i++) {
    normal.push(getLine(result.genome, i));
  }
  console.log(print(result.genome, normal));
});

