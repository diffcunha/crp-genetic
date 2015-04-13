'use strict';

var _ = require('lodash');
var CrowdProcess = require('CrowdProcess');

var generator = require('./run.js');

function Genetic(token, opts) {
  this._token = token;

  this._opts = _.defaults(opts || {}, {
    mock: false,
    nIslands: 100,
    nIndividuals: 100,
    isolationTime: 10000,
    constMutationPercent: 0.1,
    constMatePercent: 0.24,
    constMatingPopulationPercent: 0.5,
  });

  this._crossover = null;
  this._fitness = null;
  this._mutate = null;
  this._genome = null;
}

Genetic.prototype.crossover = function(fn) {
  this._crossover = fn;
};

Genetic.prototype.fitness = function(fn) {
  this._fitness = fn;
};

Genetic.prototype.mutate = function(fn) {
  this._mutate = fn;
};

Genetic.prototype.genome = function(obj, decorator) {
  this._genome = obj;
  this._decorator = decorator;
};

Genetic.prototype.run = function(ctx, cb) {
  var program = generator({
    genome: JSON.stringify(this._genome),
    decorator: this._decorator ? this._decorator.toString() : 'null',
    crossover: this._crossover.toString(),
    mutate: this._mutate.toString(),
    fitness: this._fitness.toString()
  });

  var population = [];

  if(this._opts.mock) {
    
    var mockRun = new Function("d", program.slice(program.indexOf("{") + 1, program.lastIndexOf("}")));
    
    for(var i = 0; i < this._opts.nIslands; i++) {
      population[i] = mockRun({
        id: i,
        opts: this._opts,
        context: ctx 
      }).population;
    }

    if(cb) {
      population.sort(function(a, b) {
        return b[0].score - a[0].score
      });
      cb(population[0][0]);
    }

  } else {

    var job = new CrowdProcess(this._token)(program);

    job.on('created', function(id) {
      // self.jobid = id;
      console.log("Job created");
    });

    job.on('error', function(error) {
      console.log(error);
    });

    job.on('data', function(data) {
      population[data.id] = data.population;
    });

    job.on('end', function() {
      population.sort(function(a, b) {
        return b[0].score - a[0].score
      });
      cb(population[0][0]);
    });
    
    for(var i = 0; i < this._opts.nIslands; i++) {
      job.write({
        id: i,
        opts: this._opts,
        context: ctx 
      });
    }

    job.end();
    job.inRStream.end(); // For some reason without this, the browserified version won't work
  }
};

module.exports = Genetic;