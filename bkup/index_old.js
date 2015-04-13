'use strict';

var Readable = require('stream').Readable;
var Writable = require('stream').Writable;

var CrowdProcess;

module.exports = Genetic;

function Genetic(token, fitness, mutate, crossover, islands, individuals) {
    this.fitness = fitness;
    this.mutate = mutate;
    this.crossover = crossover;

    this.population = null;

    this.config = {
        constMutationPercent: 0.1,
        constMatePercent: 0.24,
        constMatingPopulationPercent: 0.5,
        isolationTime: 1000,
        migrationRate: 0.1,
        migrationMethod: "RANDOM" /* Random or Fitness */
    };

    this._islands = islands;
    this._individuals = individuals;

    this._functions = null;
    this._scope = null;
    this._genome = null;

    this._program = null;
    CrowdProcess = require('CrowdProcess')(token);
    this.jobid = null;
}

Genetic.prototype.functions = function functions(array) {
    this._functions = [];
    for(var i = 0; i < array.length; i++) {
        var name = functionName(array[i]);
        if(name == "") {
            throw "Functions must have name"
        }
        this._functions[name] = array[i];
    }
    /* Reset program */
    this.program = null;
};

Genetic.prototype.scope = function(obj) {
    this._scope = {};
    var keys = Object.keys(obj);
    for(var i = 0; i < keys.length; i++) {
        var key = keys[i];
        this._scope[key] = obj[key];
    }
    /* Reset program */
    this._program = null;
};

Genetic.prototype.genome = function genome(obj) {
    this._genome = {
        //_count: 0
    };
    for(var gene in obj) {
        this._genome[gene] = {};
        for(var property in obj[gene]) {
            this._genome[gene][property] = obj[gene][property];
          //  this._genome._count++;
        }
    }
    /* Reset program */
    this._program = null;
};

Genetic.prototype.run = function run(iterations) {
    for(var i = 0; i < iterations; i++) {
        this.iteration()
    }
};

Genetic.prototype.iteration = function(callback) {
    var self = this;

    /* Generate program */
    if(this._program == null) {
        var functions = "";
        for(var fn in this._functions) {
            functions += fn + " = " + this._functions[fn].toString() + ";";
        }
        this._program = Run.toString()
            .replace("\"%%SCOPE%%\"", JSON.stringify(this._scope))
            .replace("\"%%GENOME%%\"", JSON.stringify(this._genome))
            .replace("\"%%FUNCTIONS%%\"", functions)
            .replace("\"%%MUTATE%%\"", this.mutate.toString())
            .replace("\"%%FITNESS%%\"", this.fitness.toString()) 
            .replace("\"%%CROSSOVER%%\"", this.crossover.toString());
        // console.log(this._program);
    }

    if(!true) {
        var mockRun = new Function("d", this._program.slice(this._program.indexOf("{") + 1, this._program.lastIndexOf("}")));
        if(this.population == null) {
            this.population = [];
            for(var i = 0; i < self._islands; i++) {
                self.population[i] = mockRun({
                    id: i,
                    config: self.config,
                    individuals: self._individuals
                }).population;
            }
        } else {
            for(var i = 0; i < self._islands; i++) {
                self.population[i] = mockRun({
                    id: i,
                    config: self.config,
                    population: self.population[i]
                }).population;
            }
        }
        callback();
        return;
    }

    var job;
    // if(this.jobid != null) {
    //     job = new CrowdProcess({id: this.jobid});
    // } else {
        job = new CrowdProcess(this._program);
    // }

    // input stream for the program
    // var data = new Readable({objectMode: true});
    // var n = self._islands;
    // data._read = function _read() {
    //     if(n--) {
    //         data.push({
    //             id: i,
    //             config: self.config,
    //             individuals: self._individuals
    //         });
    //     } else {
    //         data.push(null);
    //     }
    // };

    // results stream
    // var results = new Writable({objectMode: true});
    // var n2 = self._islands;
    // results.write = function write(chunk, encoding, cb) {
    //     n2--;
    //     self.population[chunk.id] = chunk.population;
    //     if(cb)
    //         cb();
    //     if(n2 == 0) {
    //         callback();
    //     } 
    //     return true;
    // };

    // data.pipe(job).pipe(results);

    
    job.on('created', function(id) {
        self.jobid = id;
        console.log("Job created");
    });

    job.on('error', function(error) {
        console.log(error);
    });

    job.on('data', function(data) {
        self.population[data.id] = data.population;
    });

    job.on('end', function() {
        // Migrate 
        // var countToMigrate = Math.floor(self.population.length * self.config.migrationRate);
        // for(var j = 0; j < countToMigrate; j++) {
        //     var prev = self.population[self.population.length-1][j];
        //     for(var i = 0; i < self.population.length; i++) {
        //         var tmp = self.population[i][j];
        //         self.population[i][j] = prev;
        //         prev = tmp;
        //     }
        // }
        callback();
    });

    if(self.population == null) {
        self.population = [];
        for(var i = 0; i < self._islands; i++) {
            job.write({
                id: i,
                config: self.config,
                individuals: self._individuals
            });
        }
    } else {
        for(var i = 0; i < self._islands; i++) {
            job.write({
                id: i,
                config: self.config,
                population: self.population[i]
            });
        }
    }

    job.end();
    job.inRStream.end(); // For some reason without this, the browserified version won't work

};

Genetic.prototype.createPopulation = function(number, size, generate) {
    this.population = [];
    for(var i = 0; i < number; i++) {
        this.population[i] = [];
        for(var j = 0; j < size; j++) {
            var d = generate();
            var l = this.fitness(d);
            this.population[i][j] = {
                'data' : d,
                'score' : l
            };
        }
        this.population[i].sort(function(a, b) {
            return b.score - a.score
        });
    }
};

Genetic.prototype.getSolution = function() {
    var solution = [];
    for(var i = 0; i < this.population.length; i++) {
        solution.push(this.population[i][0]);
    }
    solution.sort(function(a, b) {
        return b.score - a.score
    });
    return solution;
};

Genetic.prototype.sortPopulation = function() {
    this.population.sort(function(a, b) {
        return b.score - a.score
    });
};

// --

function Run(d) {

    var $scope = "%%SCOPE%%";
    var $genome = "%%GENOME%%";

    "%%FUNCTIONS%%";

    var mutate = "%%MUTATE%%";
    var fitness = "%%FITNESS%%";
    var crossover = "%%CROSSOVER%%";

    var population = d.population;
    var config = d.config;

    /* Utils */

    function randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    /* Generate population */

    if(d.population == null) {
        population = [];

        for(var i = 0; i < d.individuals; i++) {
            var genome = {};
            for(var gene in $genome) {
                genome[gene] = {};
                for(var property in $genome[gene]) {
                    //if(property instanceof Object) {
                        genome[gene][property] = +randomBetween($genome[gene][property]["min"], $genome[gene][property]["max"]).toFixed($genome[gene][property]["precision"]);
                        // console.log(genome[gene][property]);
                    //}
                }
            }
            // console.log(genome);
            var score = fitness($scope, genome);
            // console.log(score);
            population.push({
                'data' : genome,
                'score' : score
            });
        }
        population.sort(function(a, b) {
            return b.score - a.score
        });
    }

    /* Iterations */

    var countToMate = Math.floor(population.length * config.constMatePercent);
    var offspringCount = countToMate * 2;
    var matingPopulationSize = Math.floor(population.length * config.constMatingPopulationPercent);

    for(var i = 0; i < config.isolationTime; i++) {
        var offspringIndex = population.length - offspringCount;
        /* mate and form the next generation */
        for(var motherID = 0; motherID < countToMate; motherID++) {
            var fatherID = Math.floor(Math.random() * matingPopulationSize);
            crossover(
                population[motherID].data,
                population[fatherID].data,
                population[offspringIndex].data,
                population[offspringIndex + 1].data);
            /* mutate, if needed */
            if(Math.random() > config.constMutationPercent) {
                mutate(population[offspringIndex].data);
            }
            /* score the two new offspring */
            population[offspringIndex].score = fitness($scope, population[offspringIndex].data);
            population[offspringIndex + 1].score = fitness($scope, population[offspringIndex + 1].data);
            /* move to the next one */
            offspringIndex += 2;
        }
        /* Sort population */
        population.sort(function(a, b) {
            return b.score - a.score
        });
    }

    return {
        id: d.id,
        population: population
    };
}

/* Utils */

function functionName(fn) {
    var ret = fn.toString();
    ret = ret.substr('function '.length);
    ret = ret.substr(0, ret.indexOf('('));
    return ret;
}