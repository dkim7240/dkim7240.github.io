var nodes = new vis.DataSet();
var edges = new vis.DataSet();
var flows = new vis.DataSet();
var capacities = new vis.DataSet();
var clickCount = 0;
var escape = false;

nodes.add([ {id: 's', label: 's'},
                              {id: 'a', label: 'a'},
                              {id: 'b', label: 'b'},
                              {id: 'c', label: 'c'},
                              {id: 'd', label: 'd'},
                              {id: 't', label: 't'}]);
edges.add([{id: 'sa', label: '0/16', from: 's', to: 'a'},
{id: 'sb', label: '0/3', from: 's', to: 'b'},
{id: 'ab', label: '0/1', from: 'a', to: 'b'},   
{id: 'ac', label: '0/20', from: 'a', to: 'c'},
{id: 'bc', label: '0/7', from: 'b', to: 'c'},
{id: 'bd', label: '0/7', from: 'b', to: 'd'},
{id: 'cb', label: '0/5', from: 'c', to: 'b'},
{id: 'ct', label: '0/10', from: 'c', to: 't'},
{id: 'dt', label: '0/18', from: 'd', to: 't'}
]);
flows.add([{id: 'sa', value: 0},
{id: 'as', value: 0},
{id: 'sb', value: 0},
{id: 'bs', value: 0},
{id: 'ab', value: 0},
{id: 'ba', value: 0},   
{id: 'ac', value: 0},
{id: 'ca', value: 0},
{id: 'bc', value: 0},
{id: 'cb', value: 0},
{id: 'bd', value: 0},
{id: 'db', value: 0},
{id: 'ct', value: 0},
{id: 'tc', value: 0},
{id: 'dt', value: 0},
{id: 'td', value: 0}]);
capacities.add([{id: 'sa', value: 16},
{id: 'as', value: 0},
   {id: 'sb', value: 3},
   {id: 'bs', value: 0},
   {id: 'ab', value: 1},
   {id: 'ba', value: 0},   
   {id: 'ac', value: 20},
   {id: 'ca', value: 0},
   {id: 'bc', value: 7},
   {id: 'cb', value: 5},
   {id: 'bd', value: 7},
   {id: 'db', value: 0},
   {id: 'ct', value: 10},
   {id: 'tc', value: 0},
   {id: 'dt', value: 8},
   {id: 'td', value: 0}]);
var criticalEdge;
var network = null;
var editMode = -1; // 0: Add Node, 1: Delete Node, 2: Add Edge, 3: Delete Edge, 
                   // 4: Edit Node, 5: Edit Edge
// randomly create some nodes and edges
 var seed = 2;
var nodeQueue = [], edgeQueue = [], flowQueue = [], capQueue = [], parentQueue = []; 
var parent = [];
var queue = [];
var nextTask = -1;
var isEnd = false;

var INF = 987654321;
var totalFlow = 0;
var flowStack = [];
var nextTaskLog = [];
var resultLog = [];
var resultLogAdded = 0;


function setDefaultLocale() {
  var defaultLocal = navigator.language;
  var select = document.getElementById('locale');
  select.selectedIndex = 0; // set fallback value
  for (var i = 0, j = select.options.length; i < j; ++i) {
    if (select.options[i].getAttribute('value') === defaultLocal) {
      select.selectedIndex = i;
      break;
    }
  }
}

function destroy() {
  if (network !== null) {
    network.destroy();
    network = null;
  }
}

function reset(){
      var edgeIds = edges.getIds();
      edgeIds.forEach(function (id){
            flows.update({id: id, value: 0});
            edges.update({id: id, label: flows.get(id).value.toString() + "/" + capacities.get(id).value.toString()});
      });
      document.getElementById('result').innerHTML = "";
      totalFlow = 0;

      nodes.forEach(function (element){
        element.color = 'blue';
        nodes.update(element);
      });
    
      edges.forEach(function (element){
        element.color = 'blue';
        edges.update(element);
      });
  
      parentQueue = [];
      nodeQueue = [];
      edgeQueue = [];
      flowQueue = [];
      capQueue = [];
      nextTaskLog = [];

      document.getElementById("findMaxFlowNext").style.display = "inline-block";
      nextTask = -1;
}

function draw() {
  destroy();


  // create a network
  var container = document.getElementById('mynetwork');
  var options = {
    nodes: {color: 'blue', font: {color: 'white'}},
    edges: {arrows: 'to', color: {color: 'blue'} },
    layout: {randomSeed:seed}, // just to make sure the layout is the same when the locale is changed
    locale: document.getElementById('locale').value,
    manipulation: {
      addNode: function (data, callback) {
          editMode = 0;
        // filling in the popup DOM elements
        document.getElementById('operation').innerHTML = "Add Node";
       // document.getElementById('node-id').value = data.label;
        document.getElementById('node-label').value = data.label;
        document.getElementById('saveButton').onclick = saveData.bind(this, data, callback);
        document.getElementById('cancelButton').onclick = clearPopUp.bind();
        document.getElementById('network-popUp').style.display = 'block';
        
      },
      
      editNode: function (data, callback) {
        /*  
        // filling in the popup DOM elements
        document.getElementById('operation').innerHTML = "Edit Node";
       // document.getElementById('node-id').value = data.id;
        document.getElementById('node-label').value = data.label;
        document.getElementById('saveButton').onclick = saveData.bind(this, data, callback);
        document.getElementById('cancelButton').onclick = cancelEdit.bind(this,callback);
        document.getElementById('network-popUp').style.display = 'block';
        // nodes.update({id: data.label, label: data.label});
        */
       callback(null);
      },
      editEdge: function(data, callback){
        callback(null);
      },

      addEdge: function (data, callback) {
        editMode = 2;
        data.id = data.from + data.to;
        document.getElementById('saveEdgeButton').onclick = saveCapacity.bind(this, data, callback);
        document.getElementById('cancelEdgeButton').onclick = cancelEdgeEdit.bind(this,callback);
        document.getElementById('capacity-popUp').style.display = 'block';

        // edges.add({id: data.from.toString() + '-' + data.to.toString(), from: data.from , to: data.to});
      },

      deleteEdge: function(data, callback){
          editMode = 3;
            
          flows.remove(data.edges[0]);
          flows.remove(reverseEdge(data.edges[0]));
          capacities.remove(data.edges[0]);
          capacities.remove(reverseEdge(data.edges[0]));
        
          if (edges.get(reverseEdge(data.edges[0])) != null){
            edges.remove(reverseEdge(data.edges[0]));
          }
          
          callback(data);
      },

      deleteNode: function(data, callback){
          
          editMode = 1;

          data.edges.forEach(function(element){
            flows.remove(element);
            flows.remove(reverseEdge(element));
            capacities.remove(element);
            capacities.remove(reverseEdge(element));
          });
          callback(data);
      
      }

    }
  };
  data = ({nodes: nodes, edges: edges});
  network = new vis.Network(container, data, options);
}

function reverseEdge(edge)
{
      return edge.split("").reverse().join("");
}

function clearPopUp() {
  document.getElementById('saveButton').onclick = null;
  document.getElementById('cancelButton').onclick = null;
  document.getElementById('network-popUp').style.display = 'none';
}

function clearCapacityPopUp() {
    document.getElementById('saveEdgeButton').onclick = null;
  document.getElementById('cancelEdgeButton').onclick = null;
  document.getElementById('capacity-popUp').style.display = 'none';
}

function cancelEdit(callback) {
  clearPopUp();
  callback(null);
}

function cancelEdgeEdit(callback) {
  clearCapacityPopUp();
  callback(null);
}

function saveCap(data)
{
    var edgeId = data.from + data.to;
    flows.add({id: edgeId , value: 0});

    /*
    if(flows.get(reverseEdge(edgeId)) == null){
      flows.add({id: reverseEdge(edgeId), value: 0});
    }
    */
    capacities.add({id: edgeId, value: parseInt(document.getElementById('edge-capacity').value)});
    // capacities.add({id: reverseEdge(edgeId), value: 0});
    
    var flow = flows.get(edgeId);
    var capacity = capacities.get(edgeId);
    console.log("flow: " + flow.value);
    console.log("capacity: " + capacity.value);
    data.label = flow.value.toString() + '/' + capacity.value.toString();
            
    return data;

}

function saveCapacity(data, callback){
  
    if (data.from == data.to) {
          var r = confirm("Do you want to connect the node to itself?");
          if (r == true) {
            data = saveCap(data);
            callback(data);
            clearCapacityPopUp();                
          }
    }
    
    data = saveCap(data);   
    callback(data);
    clearCapacityPopUp();

}

function saveData(data,callback) {
  data.id = document.getElementById('node-label').value;
  data.label = document.getElementById('node-label').value;
  clearPopUp();

  if(nodes.get(data.id) == null){
      callback(data);
  }else{
      alert('Node with this ID already exists.');
      callback(null);
  }
  
}

function init() {
  setDefaultLocale();
  draw();
}

function hold(isPrev)
{
  escape = true;

  if (clickCount == 0){
    clickCount++;
    maxFlow(nodes.get('s'), nodes.get('t'), false);
    return;
  }

  clickCount++;

}

function prev()
{
  if (nextTaskLog.length > 1){

    nextTaskLog.pop();
    nextTask = nextTaskLog[nextTaskLog.length - 1];

    console.log("prev: " + nextTask);

  var prevNodes =   nodeQueue.pop();
  prevNodes = nodeQueue[nodeQueue.length - 1]; 
  
  prevNodes.forEach(function (element){
    nodes.update(element);
  });
  
  var prevEdges = edgeQueue.pop();
  prevEdges = edgeQueue[edgeQueue.length - 1];

  prevEdges.forEach(function (element){
    edges.update(element);
  });
  
  // flowQueue.pop();
  var prevFlows = flowQueue.pop();
  prevFlows = flowQueue[flowQueue.length - 1];

  prevFlows.forEach(function (element){
    flows.update(element);
  });
  // capQueue.pop();
  var prevCap = capQueue.pop();
  prevCap = capQueue[capQueue.length - 1]; 

  prevCap.forEach(function (element){
    capacities.update(element);
  });

  parent = parentQueue.pop();
  parent = parentQueue[parentQueue.length - 1];
  flowStack.pop();

  document.getElementById("findMaxFlowNext").style.display = "inline-block";
  next(true);
  }
}

function next(fromPrev)
{

  if (fromPrev == false){
    
    var cNodes = new vis.DataSet();
    nodes.forEach(function (element){
      cNodes.add({id: element.id, label: element.label, color: element.color });
    });
    
    var cEdges = new vis.DataSet();
    edges.forEach(function (element){
      cEdges.add({id: element.id, from: element.from, to: element.to, label: element.label });
    });
    

    var cFlows = new vis.DataSet();
    flows.forEach(function (element){
      cFlows.add({id: element.id, value: element.value });
    });
    
    
    var cCapacities = new vis.DataSet();
    capacities.forEach(function (element){
      cCapacities.add({id: element.id, value: element.value});
    });

    nodeQueue.push(cNodes);
    edgeQueue.push(cEdges);
    flowQueue.push(cFlows);
    capQueue.push(cCapacities);
    parentQueue.push(parent);
    nextTaskLog.push(nextTask);
    
  }
  if (nextTask == -1){
    maxFlowInit();
    
 // nextTaskLog.push(nextTask);
    
  }else if (nextTask == 0){
    
    nodes.forEach(function (element){
      element.color = 'blue';
      nodes.update(element);
    });
  
    edges.forEach(function (element){
      element.color = 'blue';
      edges.update(element);
    });

    findPath();
    
  //nextTaskLog.push(nextTask);
    document.getElementById("result").innerHTML = "Augmenting Path: ";

    var path = "";



    for(var p = nodes.get('t').id; p != nodes.get('s').id; p = parent[p]){
      if (parent[p] == undefined){
        document.getElementById("result").innerHTML = "No more Augmenting Path exists. <br>";
        document.getElementById("result").innerHTML += "Max flow (final): " + totalFlow.toString();
        nextTask = -2;
        
        document.getElementById("findMaxFlowNext").style.display = "none";

        return;
      }
      
      var selectedNode = nodes.get(p);
      selectedNode.color =  '#ff0000';

      nodes.update(selectedNode);

      path = path + p + " <- ";
      if (parent[p] == nodes.get('s').id){
        selectedNode = nodes.get('s');
        selectedNode.color = '#ff0000';
        nodes.update(selectedNode);
        path = path + parent[p];
      }
    }


    document.getElementById("result").innerHTML += path; 
  }else if (nextTask == 1){
    
//  nextTaskLog.push(nextTask);
    document.getElementById("result").innerHTML = "";
      var currentFlow = updateGraph();
     
      document.getElementById("result").innerHTML += "Critical Edge: " + criticalEdge + "<br>";

      /*
      for (var i = resultLog.length - resultLogAdded - 1; i < resultLog.length; i++){
      
        document.getElementById("result").innerHTML += resultLog[i];
      }
      */

      document.getElementById("result").innerHTML += "<br>";
      document.getElementById("result").innerHTML += "Current flow: " + currentFlow.toString();

    
  }else{
    return;
  }


  nextTask++;
  nextTask = nextTask % 2;
  
}

function findPath()
{
  parent = [];
  queue = [];

  parent[nodes.get('s').id] = nodes.get('s').id;
  queue.push(nodes.get('s').id);

  while(queue.length != 0){
    var currentNode = queue.shift();
    nodes.forEach(function (next){
          if(next.id != currentNode){
                var capacity = capacities.get(currentNode + next.id);
                var flow = flows.get(currentNode + next.id);
                if (capacity == null){
                     // alert(currentNode + next.id);
                }else{
                  if ((capacity.value - flow.value) > 0 && parent[next.id] == undefined){
                        queue.push(next.id);
                        parent[next.id] = currentNode;
                  }
                }
          }
    });
  }


}

function updateGraph()
{
  
  var amount = INF;
  var flow;
  var capacity;

  if (parent[nodes.get('t').id] == undefined){
    return -1;
  }

  for(var p = nodes.get('t').id; p != nodes.get('s').id; p = parent[p]){
        capacity = capacities.get(parent[p] + p);
        flow = flows.get(parent[p] + p);

        if (capacity.value - flow.value < amount){          
          criticalEdge = flow.id;
        }

        amount = Math.min(capacity.value - flow.value, amount);
  }

  resultLogAdded = 0;
  for(var p = nodes.get('t').id; p != nodes.get('s').id; p = parent[p]){
        flow = flows.get(parent[p] + p);
        var getFlow = flow.value + amount;

        document.getElementById("result").innerHTML = "";
        var resultString = "Added " + amount.toString() +  " to the weight of forward edge " + flow.id + "<br>"; 
        document.getElementById("result").innerHTML += resultString;
       // resultLog.push(resultString);
        resultString = "New weight: " + getFlow.toString() + "<br>";
        document.getElementById("result").innerHTML += resultString;
       // resultLog.push(resultString);
        
        
        flows.update({id: flow.id, value: getFlow});
        var cap = capacities.get(flow.id);
        var capacity = cap.value;

        flow = flows.get(p + parent[p]);
        if (flow == null) alert(p + parent[p]);
        getFlow = flow.value - amount;

        resultString = "Added " + amount.toString() +  " to the weight of backward edge " + flow.id + "<br>";
        document.getElementById("result").innerHTML += resultString;
       // resultLog.push(resultString);
        resultString = "New weight: " + getFlow.toString() + "<br>";
        document.getElementById("result").innerHTML += resultString;
       // resultLog.push(resultString);
       // resultLogAdded+=4; 

        flows.update({id: flow.id, value: getFlow});
  }

  totalFlow = flowStack[flowStack.length - 1];
  totalFlow += amount;
  flowStack.push(totalFlow);

  flows.forEach(function (flow){
    // if (flow.value < 0) flow.value = 0;
    edges.update({id: flow.id, label: flow.value.toString() + "/" + capacities.get(flow.id).value.toString()});
  });

  return totalFlow;

}

function maxFlowInit()
{
  nodes.forEach(function (element){
    element.color = 'blue';
    nodes.update(element);
  });

  edges.forEach(function (element){
    element.color = 'blue';
    edges.update(element);
  });

  flows.forEach(function (element){
    if(flows.get(reverseEdge(element.id)) == null){
      flows.add({id: reverseEdge(element.id), value: 0});
      capacities.add({id: reverseEdge(element.id), value: 0});
    }
  });
  
  resultLog = [];
  nextTask = -1;
  flowStack = [];
  flowStack.push(0);

  document.getElementById("result").innerHTML = "Initializing by building backward edges in residual graph...";
}

function maxFlow(source, sink)
{
      maxFlowInit();

      while(true){

           findPath();
           var result = updateGraph();
           if (result == -1) break;
          
      }

        flows.forEach(function (flow){
              if (flow.value < 0) flow.value = 0;
              edges.update({id: flow.id, label: flow.value.toString() + "/" + capacities.get(flow.id).value.toString()});
        });

        document.getElementById("result").innerHTML = "Total Max Flow: " + totalFlow.toString();
}
