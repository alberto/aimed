(function(root) {
  function require(deps, cb) {
    if (typeof deps == "string") {
      var module = modules[deps]
      return invokeModule(module);
    }
    requireAll(deps, cb);
  }

  var modules = {
    "require": {
      factory: function() { return require; }
    }
  };

  require.toUrl = function(path) {
    return path;
  }

  root.require = require;

  root.define = function define(id, deps, factory) {
    if (!factory) {
      factory = deps;
      deps = ["require", "exports", "module"];
    }
    modules[id] = {
      id: id,
      factory: factory,
      deps: deps
    };
  }

  root.define.amd = {};

  function requireAll(deps, factory) {
    var count = 0;
    function ready() {
      count++;
      if (count === deps.length) {
        var solved = solve(deps);
        invoke(factory, solved);
      }
    }

    deps.forEach(function(dep) {
      requireSingle(dep, ready);
    });
  }

  function requireSingle(dep, cb) {
    var module = modules[dep];
    if (module) {
      if (module.deps && module.deps.length && !module.loading) {
        module.loading = true;
        return requireAll(module.deps, cb);
      }
      return cb();
    }
    if(dep === "exports" || dep === "module") {
      return cb();
    }

    var path = dep + '.js';
    loadDep(path, function() {
      requireSingle(dep, cb);
    });
  }

  function resolveModule(id) {
    var module = modules[id];
    if (module.resolving) {
      return module.exports;
    }
    module.resolving = true;
    return invokeModule(module);
  }

  function solve(deps, module) {
    if (!deps) return null;
    return deps.map(function(dep) {
      if (dep === "module") {
        return module;
      }
      if (dep === "exports") {
        if (!module) {
          return {};
        }
        if (!module.exports) {
          module.exports = {};
        }
        return module.exports;
      }
      return resolveModule(dep);
    });
  }

  function invokeModule(module) {
    if (module.exports) {
      return module.exports;
    }
    var solved = solve(module.deps, module);
    var result = invoke(module.factory, solved);
    if (result) {
      module.exports = result;
    }
    return module.exports;

  }

  function invoke(factory, solved) {
    return typeof factory == "function" ? factory.apply(null, solved) : factory;
  }

  function loadDep(path, cb) {
    var script = document.createElement('script');
    script.src = path;
    script.onload = cb;
    document.body.appendChild(script);
  }
})(this);
