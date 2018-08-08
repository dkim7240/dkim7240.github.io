var nodes = new vis.DataSet();
var edges = new vis.DataSet();
var flows = new vis.DataSet();
var capacities = new vis.DataSet();

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
var adjEdges;
var network = null;
var editMode = -1; // 0: Add Node, 1: Delete Node, 2: Add Edge, 3: Delete Edge, 
                   // 4: Edit Node, 5: Edit Edge
// randomly create some nodes and edges
 var seed = 2;


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

}

function draw() {
  destroy();


  // create a network
  var container = document.getElementById('mynetwork');
  var options = {
    edges: {arrows: 'to' },
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
          //edges.remove(data.from.toString() + '-' + data.to.toString());
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
    flows.add({id: reverseEdge(edgeId), value: 0});
    capacities.add({id: edgeId, value: parseInt(document.getElementById('edge-capacity').value)});
    capacities.add({id: reverseEdge(edgeId), value: 0});
    
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

function maxFlow(source, sink)
{
      var INF = 987654321;
      var totalFlow = 0;

      /*
      edges.forEach(function (element){
            if (element.id != (element.from + element.to)){
                  var flow = flows.get(element.id);
                  element.id = element.from + element.to;
                  flow.id = element.id;
            }
      });*/

      while(true){
            var parent = {};
            var queue = [];

            parent[source.id] = source.id;
            queue.push(source.id);

            // BFS to find an augmenting path
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

            if (parent[sink.id] == undefined) break;
            var amount = INF;

            var flow;
            var capacity;

            for(var p = sink.id; p != source.id; p = parent[p]){
                  capacity = capacities.get(parent[p] + p);
                  flow = flows.get(parent[p] + p);

                  amount = Math.min(capacity.value - flow.value, amount);
            }

            for(var p = sink.id; p != source.id; p = parent[p]){
                  flow = flows.get(parent[p] + p);
                  var getFlow = flow.value + amount;
                  flows.update({id: flow.id, value: getFlow});
                  var cap = capacities.get(flow.id);
                  var capacity = cap.value;

                  flow = flows.get(p + parent[p]);
                  if (flow == null) alert(p + parent[p]);
                  getFlow = flow.value - amount;
                  flows.update({id: flow.id, value: getFlow});

            }

            totalFlow += amount;
      }


      alert(totalFlow);
      
      flows.forEach(function (flow){
            if (flow.value < 0) flow.value = 0;
            edges.update({id: flow.id, label: flow.value.toString() + "/" + capacities.get(flow.id).value.toString()});
      });
}
