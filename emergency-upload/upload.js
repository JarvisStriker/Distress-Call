$(document).ready(function(){
  $("#add").click(function(event){
    event.preventDefault();
    var name = $("#name").val();
    var number = $("#number").val();
    key = firebasedb.ref().child('emergency').push().key;
    ref = firebase.database().ref();
    var data = {
      name:name,
      number:number
    };
    var updates = {};
    updates['emergency/'+key] = data;
    ref.update(updates);
    alert("Added");
    $("form").trigger('reset');
  });

});
