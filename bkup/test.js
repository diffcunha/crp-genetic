var Genetic = require('../lib/index.js');

function decorator(genome, ctx) {
  var _vars = genome;

  function randomBetween(min, max, precision) {
    return applyPrecision(Math.random() * (max - min) + min, precision);
  }

  function applyPrecision(number, precision) {
    return +(number.toFixed(precision));
  }

  function range(name, from, to, precision) {
    if(!_vars[name] || !_vars[name].value) {
      _vars[name] = {
        range: { from: from, to: to, precision: precision },
        value: randomBetween(from, to, precision)
      };
    }
    return _vars[name].value;
  }

  function values() {
    var values = {};
    for(var name in _vars) {
      values[name] = _vars[name].value;
    }
    return values;
  }

  return {
    range: range,
    values: values
  };
}

function crossover(mother, father, child1, child2) {
  var pivot = randomBetween(1, Object.keys(mother).length-1, 0);
  for(gene in mother) {
    if(pivot > 0) {
      child1[gene].value = mother[gene].value;
      child2[gene].value = father[gene].value;
      pivot--;
    } else {
      child1[gene].value = father[gene].value;
      child2[gene].value = mother[gene].value;
    }
  }
}

function mutate(genome) { }

var genetic = new Genetic('369dbb2e-00dc-46e0-8fe8-ed81ce4060ac', { mock: false });

genetic.crossover(crossover);
genetic.mutate(mutate);
genetic.genome({}, decorator);

genetic.fitness(function(vars, ctx) {
  var var1 = vars.range('var1', -10, 10, 4);
  return -Math.pow(var1, 2);
});

genetic.run({ }, function(result) {
  console.log(result.genome);
});