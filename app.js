var ccApp = angular.module('ccApp', ['ngRoute', 'firebase']);

var reportsRef = firebase.database().ref().child("reports");
var donationsRef = firebase.database().ref().child("donations");
var volunteersRef = firebase.database().ref().child("volunteers");

var imageStorageRef = firebase.storage().ref().child("images");

document.addEventListener("touchmove", function(e) { e.preventDefault() });

ccApp.config(['$routeProvider', function($routeProvider) {
	$routeProvider.
	when('/home', {
		templateUrl: 'templates/home.html',
		controller: 'HomeController'
	}).
	when('/calamity', {
		redirectTo: '/home'
	}).
	when('/calamity/donate', {
		templateUrl: 'templates/donate.html',
		controller: 'DonationController'
	}).
	when('/calamity/timeline', {
		templateUrl: 'templates/timeline.html',
		controller: 'TimelineController'
	}).
	when('/calamity/volunteer', {
		templateUrl: 'templates/volunteer.html',
		controller: 'VolunteerController'
	}).
	when('/calamity/contact', {
		templateUrl: 'templates/contact.html',
		controller: 'EmergencyContactController'
	}).
	when('/calamity/:location', {
		templateUrl: 'templates/calamity.html',
		controller: 'CalamityController'
	}).
	otherwise({
		redirectTo: '/home'
	});
}]);

/**
	HomeController
**/
ccApp.controller('HomeController', function($scope, $firebaseArray) {
	$scope.report = {};

	var list = $firebaseArray(reportsRef);

	$scope.reportCalamity = function() 
	{

		$scope.report.calamity = $('#report_type').val();
		$scope.report.condition = parseInt( $('#report_condition').val() );

		var currentdate = new Date();
		$scope.report.time = currentdate.getDate() + "-" + (currentdate.getMonth()+1)  + "-" + currentdate.getFullYear() + " " + currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();
		$scope.report.timestamp = firebase.database.ServerValue.TIMESTAMP;

		var address = $('#report_area').val() + ", " + $('#report_city').val();

		var geocoder = new google.maps.Geocoder();
		console.log(geocoder);	
		geocoder.geocode( { "address": address }, function(result, status) {
		    if (status == google.maps.GeocoderStatus.OK && result.length > 0) {
					$scope.report.lat = result[0].geometry.location.lat();
					$scope.report.lng = result[0].geometry.location.lng();

					list.$add($scope.report).then(function() {
						$('#reportModal').modal('toggle');
					});
		    } else {
					list.$add($scope.report).then(function(ref) {
						$('#reportModal').modal('toggle');
					});
			}
		});

	};
});

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}
	
/**
	CalamityController
**/
ccApp.controller('CalamityController', function($scope, $routeParams, $http, $firebaseArray) {
	$scope.rep_count = 0;
	$scope.reports = $firebaseArray(reportsRef);

	var heatMapData = [];
	var arLatLng = [];

	$scope.location = $routeParams.location.toLowerCase().replace(/\b[a-z]/g, function(letter) {
	    return letter.toUpperCase();
	});

	$scope.initialize = function() {
		var geocoder = new google.maps.Geocoder();
		var mapOptions = { zoom: 10 };
		var map = new google.maps.Map(document.getElementById("map"), mapOptions);

		geocoder.geocode( { "address": $scope.location }, function(results, status) {
		    if (status == google.maps.GeocoderStatus.OK && results.length > 0) {
		        var location = results[0].geometry.location;
		        map.panTo(location);
		    } else {
		    	$('#map').html('<div class="container"><div class="alert alert-dismissible alert-danger">\
					<button type="button" class="close" data-dismiss="alert">&times;</button>\
					<strong>Oh snap!</strong> <a href="#home" class="alert-link">Location could not be found, please try again!.\
					</div></div>')
		    }
		});

		reportsRef.on('child_added', function(snapshot) 
		{
			snapshot = snapshot.val();
			var latLng = new google.maps.LatLng(snapshot.lat, snapshot.lng);
			console.log(latLng);
			var intensity = randomIntFromInterval(1, 5);
			console.log(intensity);
			heatMapData.push({
				location: latLng,
				weight: intensity
			});

			$scope.rep_count += 1;

			setTimeout(function() {
				var heatmap = new google.maps.visualization.HeatmapLayer({
        	data: heatMapData
      	});

				//console.log(map);
				heatmap.setMap(map);
				//heatmap.setMap(heatmap.getMap() ? null : map);
			}, 0);
		});
  }
});


ccApp.controller('DonationController', function($scope, $firebaseArray) {
	var list = new $firebaseArray(donationsRef);
	$scope.donors = $firebaseArray(donationsRef);
	$scope.donor = {};

	$scope.donate = function() {
		list.$add($scope.donor);
		$('#donateModal').modal('toggle');
	};
});

ccApp.controller('VolunteerController', function($scope, $firebaseArray) {
	var list = new $firebaseArray(volunteersRef);
	$scope.volunteers = $firebaseArray(volunteersRef);
	$scope.volunteer = {};

	$scope.volunteerRegistration = function() {
		list.$add($scope.volunteer);
		$('#volunteerModal').modal('toggle');
	};
});

ccApp.controller('EmergencyContactController', function($scope) {

});

ccApp.controller('TimelineController', function($scope, $firebaseArray) {
	$scope.reports = $firebaseArray(reportsRef);
	$scope.rep_count = 0;
	$scope.images = {};

	reportsRef.on('child_added', function(snapshot) {
		$scope.rep_count += 1;
		var imgRef = imageStorageRef.child(snapshot.key + '.png');

		if ( snapshot.val().isImagePresent ) {
			var imgRef = imageStorageRef.child(snapshot.key + '.png');
			imgRef.getDownloadURL().then(function(url) {
				$('#' + snapshot.key).attr("src", url);
			});
			console.log(snapshot.val());
		}
	});
});
