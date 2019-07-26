/*global ResourceRequest _config*/

var ResourceRequest = window.ResourceRequest || {};

(function reqEC2ScopeWrapper($) {

    var authToken;
    ResourceRequest.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = 'signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = 'signin.html';
    });


    function createVPC() {
            $.ajax({
                method: 'POST',
                url: _config.api.invokeUrl + '/user-vpcs',
                headers: {
                    Authorization: authToken
                },
                data: JSON.stringify({
                    Resource: {}
                }),
                contentType: 'application/json',
                success: function (result){completeVPCPostRequest (result);} ,
                error: function ajaxError(jqXHR, textStatus, errorThrown) {
                    console.error('Error requesting a resource: ', textStatus, ', Details: ', errorThrown);
                    console.error('Response: ', jqXHR.responseText);
                    alert('An error occured when requesting resources:\n' + jqXHR.responseText);
                }
            });
    }
    
    function waittoreloadpage(){
        location.reload();
    }
    
    function completeVPCPostRequest (result) {
        alert ("Wait for few minutes for you environement to be ready. First time user environment setup might take up to 5 minutes to get ready. If you did not see the the create stack button not activated in 5 minutes then please refresh your page. " );
        $("#createVPCStack").attr("disabled", true);
        setTimeout(waittoreloadpage, 120000);
    }

    // Validate the stack input parameters
    function validParams() {
        
        //Get and populate the resources needed
        //This function should be called from the create resources page only 
        getGlobalAWSResources();
        // Get and populate the user created resources
        getUserAWSResources();

        vpc      = $('#vpc').val()      ;
        subnet   = $('#subnet').val()   ;
        ami      = $('#ami').val()      ;
        type     = $('#type').val()     ;
        username = $('#username').val() ;
        sshkey   = $('#sshkey').val()   ;
        ports    = $('#ports').val()    ;
        srcnw    = $('#srcnw').val()    ;
        
        if (!(vpc)){
            alert("Initiate your env and wait for the initiation to complete");
            return false;
        }
        return true;
    }


    function createResources() {

        stacknm = $('#stackname').val() ;
        ami     = $('#ami').val()       ;
        type    = $('#type').val()      ;
        vpc     = $('#vpc').val()       ;
        subnet  = $('#subnet').val()    ;
        username= $('#username').val()  ;
        sshkey  = $('#sshkey').val()    ;
        ports   = $('#ports').val()     ;
        srcnw   = $('#srcnw').val()     ;

        if (validParams()){
            $.ajax({
                method: 'POST',
                url: _config.api.invokeUrl + '/resourcerequest',
                headers: {
                    Authorization: authToken
                },
                data: JSON.stringify({
                    Resource: {
                        StackName: stacknm,
                        AMI: ami,
                        Type: type,
                        VPC: vpc,
                        Subnet:subnet,
                        Sshkey:sshkey,
                        Username:username,
                        Ports:ports,
                        SrcNW:srcnw
                    }
                }),
                contentType: 'application/json',
                success: function (result){completeCreateResources (result);} ,
                error: function ajaxError(jqXHR, textStatus, errorThrown) {
                    console.error('Error requesting a resource: ', textStatus, ', Details: ', errorThrown);
                    console.error('Response: ', jqXHR.responseText);
                    alert('An error occured when requesting resources:\n' + jqXHR.responseText);
                }
            });
        }
    }

    function completeCreateResources (result) {
        alert (result);
        $("#createStack").attr("disabled", false);
        setTimeout(waittoreloadpage, 500);
    }

    function terminateResources(stackid) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/stackterminate',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                Resource: {
                    stackid: stackid,
                }
            }),
            contentType: 'application/json',
            success: function (result){completeStackTerminate (result);},
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting a resource: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when requesting resources:\n' + jqXHR.responseText);
            }
        });
    }

    function completeStackTerminate (result) {
        setTimeout(waittoreloadpage, 500); 
    }

    // Retrieve AWS resources , AMIs, Security groups , etc
    function getGlobalAWSResources() {
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/aws-resources',
            headers: {
                Authorization: authToken
            },
            contentType: 'application/json',
            success: function (result){fillOutAWSResourcesFields (result,'aws-resources');} ,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting a resource: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when requesting resources:\n' + jqXHR.responseText);
            }
        });
    }
    
    //Parse the result to a drop down list
    function fillOutAWSResourcesFields (result,elementId) {
        if (result){
            var resultJSON = JSON.parse(result);
            fillUpDropDownList( 'ami', resultJSON['images'], "id", "name");
        }
    }

    // take a list of jsons object (dataList),  then populate the json values (attValue,attName) into a dropdown list with id=elementId
    function fillUpDropDownList (elementId, dataList, attValue, attName){
       var element = document.getElementById(elementId);
       listLength = dataList.length;
       for(var idx = 0; idx < listLength ; idx++) {
           var option = '<option value="'+ dataList[idx][attValue] +'">'+ dataList[idx][attName] +'</option>'; 
           $(option).appendTo(element);
       }
    }

    // Retrieve user resources , stacks created by the user
    function getUserAWSResources() {
        $.ajax({
            method: 'GET',
            url: _config.api.invokeUrl + '/user-resources',
            headers: {
                Authorization: authToken
            },
            contentType: 'application/json',
            success: function (result){fillupUsersResFields (result);} ,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting a resource: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when requesting resources:\n' + jqXHR.responseText);
            }
        });
    }
    
    //Parse the result to a drop down list
    function fillupUsersResFields (result) {
        if (result){
            var resultJSON = JSON.parse(result);
            if (resultJSON['vpcs']){
                dataList = resultJSON['vpcs']
                listLength = dataList.length;
                if (listLength) {
                    //call fillUpDropDownList if user have the right to create more than one vpc
                    //fillUpDropDownList('vpcStackList', resultJSON['resources'], "vpcstackid", "vpcstackid");
                    //Users have one vpc stack , so index 0 is ok
                    
                    //Send the VPC(s) and the SUBNET(s) to a hidden HTML tag 
                    stackInfo(dataList[0]["stackid"], "vpcs-stacks");
                    // list and populate stack resources if they exists
                    if (resultJSON['resources']){
                        fillUpDropDownList('stackList', resultJSON['resources'], "stackid", "stackid");
                        var stackno = $("#stackList").children('option').length;
                        if (stackno > 0){
                            stackid = $("#stackList").val();
                            stackInfo(stackid, "resources-stacks");
                            stackEC2Operations(stackid,"status");
                            // Since there is at least one stack then show the stackdiv (resources list, populate and delete functionalities) 
                            $("#stacksdiv").show();
                            $("#noStacks").hide();
                        }
                        else { 
                            $("#stacksdiv").hide();
                            $("#noStacks").show();
                        }
                        // if no resources running , user can delere their environments (VPCs)
                        //else { $("#deleteVPCStack").show();} DELETE VPC ENV not implemented yet
                    }
                }
                // user does not have environment (vpc), activate creating the env.
                else {
                    $("#userEnvMainDiv").show();
                    $("#createVPCStack").attr("disabled", false);
                    //location.reload(); 
                    //$("#deleteVPCStack").hide(); DELETE VPC ENV not implemented yet
                }
            }
        }
    }

    // Information about the selected stack ID 
    function stackInfo(stackid,stackstable) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/stackinformation',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                Resource: {
                    stackid: stackid,
                    stackstable: stackstable,
                }
            }),
            contentType: 'application/json',
            success: function (result){completeStackInfos (result,stackstable);},
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting a resource: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when requesting resources:\n' + jqXHR.responseText);
            }
        });
    }

    //Parse the result and inserted to a table
    function completeStackInfos (result,stackstable) {
        if (result){
            // If populating the resources stack
            if (stackstable=="resources-stacks"){
                var tbl = document.getElementById("stackInfoTable");
                tbl.innerHTML = "";
                var resultJSON_ALL = JSON.parse(result);
                var resultJSON = resultJSON_ALL['Outputs']
                var stackstatus = resultJSON_ALL['StackStatus']
                var stackname = resultJSON_ALL['StackName']
                if (stackstatus == 'CREATE_COMPLETE'){
                    resultLen = resultJSON.length;
                    for(var r = 0; r < resultLen ; r++) {
                        var row = document.createElement("tr");
                        var object = resultJSON[r];
                        for (const key of Object.keys(object)) {
                            var cell = document.createElement("td");
                            var cellText = document.createTextNode(object[key]);
                            cell.appendChild(cellText);
                            row.appendChild(cell);
                        }
                        //if (object['OutputKey']=='InstanceId'){ console.log(object['OutputValue']);  }
                        tbl.appendChild(row);
                    }
                    //Show the EC2 start/stop buttons
                }
                else {
                    tbl.innerHTML = stackstatus;
                   //Hide the EC2 start/stop buttons
                }
                //tbl.style.border = "solid blue";
                $("td").css("border","2px solid grey");
            }

            // Else if populating VPCs and subnets (set to one VPC per user for now)
            else {
                var resultJSON_ALL = JSON.parse(result);
                var resultJSON = resultJSON_ALL['Outputs']
                var stackstatus = resultJSON_ALL['StackStatus']
                if (stackstatus == 'CREATE_COMPLETE'){
                    resultLen = resultJSON.length;
                    var vobject = resultJSON[0];
                    var sobject = resultJSON[1];
                    var vpc    = vobject["OutputValue"];
                    var subnet = sobject["OutputValue"];
                    var vpctag    = document.getElementById('vpc');
                    var subnettag = document.getElementById('subnet');
                    var vpcoption    = '<option value="'+ vpc + '">'+ vpc + '</option>';
                    $(vpcoption).appendTo(vpctag);
                    var subnetoption = '<option value="'+ subnet + '">'+ subnet + '</option>';
                    $(subnetoption).appendTo(subnettag);
                    
                    // Only activate create stack when the user VPC CF template is completed 
                    $("#userEnvMainDiv").hide();
                    $("#createStacksMainDiv").show();
                    $("#showStacksMainDiv").show();
                    $("#createStack").attr("disabled", false);
                    //location.reload(); 
                }
                // Else if the VPC is not ready keep showing the "User Environment Initiation" Message
                else {
                    $("#userEnvMainDiv").show();
                }
            }
        }
    }
    
    // Start or stop a stack instance 
    function stackEC2Operations(stackid,action) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/stackec2operations',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                Resource: {
                    stackid: stackid,
                    action: action,
                }
            }),
            contentType: 'application/json',
            success: function (result){togglebuttons (result);},
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting a resource: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when requesting resources:\n' + jqXHR.responseText);
            }
        });
    }

    //Parse the result and inserted to a table
    function togglebuttons(result) {
        res = result.slice(1, -1)
        $("#ec2status").html ("EC2 Server Status: " + res.toUpperCase()) ;
        if (res == "running") {
            $('#stackStartEC2').prop('checked',false);
            $('#stackStopEC2').prop('checked',true);
            $('#stackStopEC2').attr("disabled", false);
        }
        else if (res == "stopped") {
            $('#stackStartEC2').prop('checked',true);
            $('#stackStopEC2').prop('checked',false);
            $('#stackStartEC2').attr("disabled", false);
        }
        else {
            $('#stackStartEC2').prop('checked',false);
            $('#stackStopEC2').prop('checked',false);
            
            $('#stackStartEC2').attr("disabled", true);
            $('#stackStopEC2').attr("disabled", true);
        }
    }
    
    // Register click handler for #request button
    $(function onDocReady() {

        ResourceRequest.authToken.then(function permitAccess(token) {
            if (token) {
            //Get and populate the resources needed
            //This function should be called from the create resources page only 
            getGlobalAWSResources();
            // Get and populate the user created resources
            getUserAWSResources();
            
            $('#createStack').click(handleCreateStackClick);
            $('#createVPCStack').click(handleCreateVPCStackClick);
            $('#stackTerminate').click(handleTerminateStackClick);
            $('#stackStartEC2').click(handleStackStartEC2Click);
            $('#stackStatusEC2').click(handleStackStatusEC2Click);
            $('#stackStopEC2').click(handleStackStopEC2Click);
            $('#stackList').click(handleStackInfoClick);
            $('#stackList').change(handleStackInfoChange);
            
            $('#signOut').click(function() {
                ResourceRequest.signOut();
                alert("You have been signed out.");
                window.location = "signin.html";
            });
            //displayUpdate('You are authenticated. Click to see your <a href="#authTokenModal" data-toggle="modal">auth token</a>.');
            //$('.authToken').text(token);
            }
        });

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
        }
    });

    function handleStackInfoClick(event) {
        var stackid = $('#stackList').val();
        stackInfo(stackid, "resources-stacks");
        stackEC2Operations(stackid,"status");
    }

    function handleStackInfoChange(event) {
        var stackid = $('#stackList').val();
        stackInfo(stackid, "resources-stacks");
        stackEC2Operations(stackid,"status");
    }

    function handleCreateStackClick(event) {
        $("#createStack").attr("disabled", true);
        //location.reload(); 
        createResources();
    }

    function handleCreateVPCStackClick(event) {
        createVPC();
    }
    
    function handleStackStartEC2Click(event) {
        var stackno = $("#stackList").children('option').length;
        if (stackno > 0){
            var action = "start";
            stackEC2Operations($("#stackList").val(),action);
        }
        else {
            alert("Select the Stack first");
        }
    }

    function handleStackStatusEC2Click(event) {
        var stackno = $("#stackList").children('option').length;
        if (stackno > 0){
            var action = "status";
            stackEC2Operations($("#stackList").val(),action);
        }
        else {
            alert("Select the Stack first");
        }
    }

    function handleStackStopEC2Click(event) {
        var stackno = $("#stackList").children('option').length;
        if (stackno > 0){
            var action = "stop";
            stackEC2Operations($("#stackList").val(),action);
        }
        else {
            alert("Select the Stack first");
        }
    }

    function handleTerminateStackClick(event) {
        var stackno = $("#stackList").children('option').length;
        if (stackno > 0){
            var stackid = $("#stackList").val();
            var result = confirm("Are you sure you want to delete the stack " + stackid  + " ?");
            if (result) {
                terminateResources(stackid);
            }
        }
        else {
            alert("Select the Stack first");
        }
    }

    function displayUpdate(text) {
        $('#updates').append($('<li>' + text + '</li>'));
    }



}(jQuery));
