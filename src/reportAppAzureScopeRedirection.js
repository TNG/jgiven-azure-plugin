$scope.redirectTo = function (location) {
    if (location.includes('#')) {
        location = location.slice(1, location.length);
    }
    location = decodeURIComponent(location);
    $scope.updatingLocation = true;
    if ($location.path() !== location) {
        $location.path(location);
    }
    $scope.updatingLocation = false;
    $scope.$apply();
};