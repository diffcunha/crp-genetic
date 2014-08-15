'use strict';

module.exports = Genetic;

function Genetic(token, opts) {
    this.token = token;
    this.opts = opts || {
        nIslands: 1,
        nIndividuals: 100,
        isolationTime: 100,
        constMutationPercent: 0.1,
        constMatePercent: 0.24,
        constMatingPopulationPercent: 0.5,
    };
}

Genetic.prototype.run = function(fitness, vars) {

    var program = Run.toString()
        .replace("\"%%GENOME%%\"", JSON.stringify(vars))
        .replace("\"%%FITNESS%%\"", fitness.toString());

    if(true) {
        var mockRun = new Function("d", program.slice(program.indexOf("{") + 1, program.lastIndexOf("}")));
        var population = [];

        for(var i = 0; i < this.opts.nIslands; i++) {
            population[i] = mockRun({
                id: i,
                opts: this.opts
            }).population;
        }

        return population[0];
    }

};


function test() {
    var genetic = new Genetic();

    function func(vars) {
        return vars.var1 + vars.var2;
    }

    var vars = {
        var1: {
            min: -1,
            max: 10,
            step: 0.01
        },
        var2: {
            min: -1,
            max: 10,
            step: 0.01
        }
    };

    // var resut = genetic.max(func, vars);
    // var resut = genetic.min(func, vars);

    var output = genetic.run(func, vars);

    console.log(output);

    // assert(result == {
    //     var1: 21,
    //     var2: 2
    // });

    // assert(outuput = {
    //     value: 10,
    //     context: {
    //         abc: '1'
    //     }
    // });

}
test();

/*
 inputs = {
    population: null | [...],
    genome: {
        var1: {
            min: 1,
            max: 2,
            step: 0.1
        },
        var2: {
            min: 1,
            max: 2,
            step: 0.1
        }
    }
 }
*/

function Run(d) {

    var genomeSpec = "%%GENOME%%";  

    var opts = d.opts;
    var population = d.population || generatePopulation(opts.nIndividuals, genomeSpec);

    /* Iterations */

    var countToMate = Math.floor(population.length * opts.constMatePercent);
    var offspringCount = countToMate * 2;
    var matingPopulationSize = Math.floor(population.length * opts.constMatingPopulationPercent);

    for(var i = 0; i < opts.isolationTime; i++) {
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
            if(Math.random() > opts.constMutationPercent) {
                mutate(population[offspringIndex].genome);
            }
            /* score the two new offspring */
            population[offspringIndex].score = fitness(population[offspringIndex].genome);
            population[offspringIndex + 1].score = fitness(population[offspringIndex + 1].genome);
            /* move to the next one */
            offspringIndex += 2;
        }
        /* Sort population */
        population.sort(function(a, b) {
            return b.score - a.score
        });
        // console.log(population[0]);
    }

    return {
        id: d.id,
        population: population
    };

    /* Genetic functions */

    function fitness(genome) {
        return ("%%FITNESS%%")(genome);
    }

    function mutate(genome) {
        /* Pick a random gene */
        var gene = Object.keys(genome)[Math.round(Math.random() * (Object.keys(genome).length-1))];
        /* Increment or decrement step */
        genome[gene] = applyPrecision(genome[gene] + (Math.random() <= 0.5 ? -1 : 1) * genomeSpec[gene].step, getPrecision(genomeSpec[gene].step));
    }

    function crossover(mother, father, child1, child2) {
        var pivot = randomBetween(1, Object.keys(mother) - 1);
        var count = 0;
        for(var gene in mother) {
            if(count < pivot) {
                child1[gene] = mother[gene];
                child2[gene] = father[gene];
            } else {
                child1[gene] = father[gene];
                child2[gene] = mother[gene];
            }
            count++;
        }
    }

    /* Aux functions */

    function generatePopulation(nIndividuals, genomeSpec) {
        var population = [];
        for(var i = 0; i < nIndividuals; i++) {
            var genome = buildGenome(genomeSpec);
            var score = fitness(genome);
            population.push({
                genome: genome,
                score: score
            });
        }
        population.sort(function(a, b) {
            return b.score - a.score
        });
        return population;
    }

    function buildGenome(genomeSpec) {
        var genome = {};
        for(var geneSpec in genomeSpec) {
            genome[geneSpec] = randomBetween(genomeSpec[geneSpec].min, genomeSpec[geneSpec].max, getPrecision(genomeSpec[geneSpec].step));
        }
        return genome;
    }

    function randomBetween(min, max, precision) {
        return applyPrecision(Math.random() * (max - min) + min, precision);
    }

    function applyPrecision(number, precision) {
        return +(number.toFixed(precision));
    }

    function getPrecision(number) {
        return (number + '').split('.')[1].length;
    }
}
