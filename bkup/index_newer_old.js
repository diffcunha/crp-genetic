'use strict';

module.exports = Genetic;

var _ = require('underscore');

function Genetic(token, opts) {
  this.token = token;
  this.opts = opts || {
    nIslands: 1,
    nIndividuals: 40,
    isolationTime: 10000,
    constMutationPercent: 0.9,
    constMatePercent: 0.49,
    constMatingPopulationPercent: 0.7,
  };
}

Genetic.prototype.run = function(fitness, mutate, vars, context) {
  var program = Run.toString()
  .replace("\"%%GENOME%%\"", JSON.stringify(vars))
  .replace("\"%%MUTATE%%\"", mutate.toString())
  .replace("\"%%FITNESS%%\"", fitness.toString());

  if(true) {
    var mockRun = new Function("d", program.slice(program.indexOf("{") + 1, program.lastIndexOf("}")));
    var population = [];

    for(var i = 0; i < this.opts.nIslands; i++) {
      population[i] = mockRun({
        id: i,
        opts: this.opts,
        context: context
      }).population;
    }

    return population[0];
  }

};

function Run(d) {

    var genomeSpec = "%%GENOME%%";  
    var context = d.context;

    var opts = d.opts;
    var population = d.population || generatePopulation(opts.nIndividuals, genomeSpec);

    function getLine(line, arr) {
        var res = [];
        for(var i = 0; i < 3; i++) {
            for(var j = 0; j < 3; j++) {
                res.push(arr[i + (3 * Math.floor(line / 3))][j + (3 * (line % 3))]);
            }
        }
        return res;
    }

    function getColumn(column, arr) {
        var res = [];
        for(var i = 0; i < 3; i++) {
            for(var j = 0; j < 3; j++) {
                res.push(arr[(i * 3) + Math.floor(column / 3)][(j * 3) + (column % 3)])
            }
        }
        return res;
    }

    function sum(arr) {
        return arr.reduce(function(previous, current) {
            return previous + current;
        });
    }

    function g3(arr) {
        return [1,2,3,4,5,6,7,8,9].filter(function(item, index, array) {
            return arr.indexOf(item) === -1;
        }).length 
    }

    function pretty(arr) {
        var res = [];
        for(var i = 0; i < 9; i++) {
            res.push(getLine(i, arr));
        }
        return res;
    }

    /* Iterations */

    // 1000 * 0.1 = 100
    var countToMate = Math.floor(population.length * opts.constMatePercent);
    // 100 * 2 = 200
    var offspringCount = countToMate * 2;
    // 1000 * 0.5 = 500
    var matingPopulationSize = Math.floor(population.length * opts.constMatingPopulationPercent);

    for(var spring = 0; spring < opts.isolationTime; spring++) {
        var offspringIndex = population.length - offspringCount;
        /* mate and form the next generation */
        for(var motherID = 0; motherID < countToMate; motherID++) {
            var fatherID = Math.floor(Math.random() * matingPopulationSize);
            crossover(
                population[motherID].genome,
                population[fatherID].genome,
                population[offspringIndex].genome,
                population[offspringIndex + 1].genome);
            /* mutate, if needed */
            if(Math.random() < opts.constMutationPercent) {
                mutate(population[offspringIndex].genome, context);
            }
            /* score the two new offspring */
            population[offspringIndex].score = fitness(population[offspringIndex].genome, context);
            population[offspringIndex + 1].score = fitness(population[offspringIndex + 1].genome, context);
            /* move to the next one */
            offspringIndex += 2;
        }
        /* Sort population */
        population.sort(function(a, b) {
            // return b.score - a.score; // max
            return a.score - b.score; // min
        });
        
        var best = population[0];
        
        if(best.score === 0) {
            break;
        }

        if(spring % 100 == 0) {
            console.log('Spring ' + spring);
            console.log(pretty(best.genome));

            var colR = [];
            var linR = [];
            for(var j = 0; j < 9; j++) {
                colR.push(g3(getColumn(j, best.genome)));
                linR.push(g3(getLine(j, best.genome)));
            }

            console.log("column: [" + colR + '] = ' + sum(colR));
            console.log("line:   [" + linR + '] = ' + sum(linR));
            console.log("score: " + best.score);
        }

    }

    return {
        id: d.id,
        population: population
    };

    /* Genetic functions */

    function fitness(genome, context) {
        return ("%%FITNESS%%")(genome, context);
    }

    function mutate(genome, context) {
        return ("%%MUTATE%%")(genome, context);
    }

    function crossover(mother, father, child1, child2) {
        var pivot = randomBetween(1, mother.length-1);
        for(var i = 0; i < pivot; i++) {
            child1[i] = mother[i].slice(0);
            child2[i] = father[i].slice(0);
        }
        for(var i = pivot; i < mother.length; i++) {
            child1[i] = father[i].slice(0);
            child2[i] = mother[i].slice(0);
        }
    }

    /* Aux functions */

    function generatePopulation(nIndividuals, genomeSpec) {
        var population = [];
        for(var i = 0; i < nIndividuals; i++) {
            var genome = buildGenome(genomeSpec);
            var score = fitness(genome, context);
            population.push({
                genome: genome,
                score: score
            });
        }
        population.sort(function(a, b) {
            // return b.score - a.score;
            return a.score - b.score;
        });
        return population;
    }

    function buildGenome(genomeSpec) {
        var genome = [];        
        for(var i = 0; i < genomeSpec.length; i++) {
            var diff = [1,2,3,4,5,6,7,8,9].filter(function(item, index, array) {
                return genomeSpec[i].indexOf(item) === -1;
            })
            genome[i] = genomeSpec[i].map(function(elem) {
                if(elem === 0) {
                    return diff.pop();
                } else {
                    return elem;
                }
            });
        }

        // for(var i = 0; i < genomeSpec.length; i++) {
        //     genome[i] = randomBetween(genomeSpec[i].min, genomeSpec[i].max, getPrecision(genomeSpec[i].step));
        // }


        // for(var geneSpec in genomeSpec) {
        //     if(typeof genomeSpec[geneSpec] === 'number') {
        //         genome[geneSpec] = genomeSpec[geneSpec];
        //     } else {
        //         genome[geneSpec] = randomBetween(genomeSpec[geneSpec].min, genomeSpec[geneSpec].max, getPrecision(genomeSpec[geneSpec].step));
        //     }

        //     // genome[geneSpec] = genomeSpec[geneSpec].set[randomBetween(0, genomeSpec[geneSpec].set.length-1)];
        // }
        return genome;
    }

    function randomBetween(min, max, precision) {
        return applyPrecision(Math.random() * (max - min) + min, precision);
    }

    function applyPrecision(number, precision) {
        return +(number.toFixed(precision));
    }

    function getPrecision(number) {
        if((number + '').split('.').length === 1) {
            return 0;
        } else {
            return (number + '').split('.')[1].length;
        }
    }
}