// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PatientRegistration {
    struct Patient {
        address walletAddress;
        string name;
        string dateOfBirth;
        string gender;
        string bloodGroup;
        string homeAddress;
        string email;
        string hhNumber;
        string password;
    }

    struct PatientList {
        string patient_number;
        string patient_name;
    }

    struct Record {
        uint id;
        string date;
        string description;
        string doctor;
    }

    mapping(string => bool) public isPatientRegistered;
    mapping(string => bool) public isDoctorRegistered;
    mapping(string => Patient) public patients;
    mapping(string => PatientList[]) private Dpermission;
    mapping(string => mapping(string => bool)) public doctorPermissions;
    mapping(string => Record[]) private patientRecords; // Mapping to store patient records
    mapping(string => string[]) private fileRecords; // Mapping to store file records
    string[] private patientHhNumbers; // Array to store all registered hhNumbers
    uint public registeredPatientCount; // Counter for registered patients

    event PatientRegistered(string hhNumber, string name, address walletAddress);
    event RecordAdded(string hhNumber, uint recordId, string date, string doctor);
    event RecordUploaded(string hhNumber, string cid);

    function registerPatient(
        address _walletAddress,
        string memory _name,
        string memory _dateOfBirth,
        string memory _gender,
        string memory _bloodGroup,
        string memory _homeAddress,
        string memory _email,
        string memory _hhNumber,
        string memory _password
    ) external {
        require(!isPatientRegistered[_hhNumber], "Patient already registered");

        Patient memory newPatient = Patient({
            walletAddress: _walletAddress,
            name: _name,
            dateOfBirth: _dateOfBirth,
            gender: _gender,
            bloodGroup: _bloodGroup,
            homeAddress: _homeAddress,
            email: _email,
            hhNumber: _hhNumber,
            password: _password
        });

        patients[_hhNumber] = newPatient;
        isPatientRegistered[_hhNumber] = true;
        patientHhNumbers.push(_hhNumber); // Add hhNumber to the list
        registeredPatientCount++; // Increment the count
        emit PatientRegistered(_hhNumber, _name, _walletAddress);
    }

    function isRegisteredPatient(string memory _hhNumber) external view returns (bool) {
        return isPatientRegistered[_hhNumber];
    }

    // Add a function to validate patient's password
    function validatePassword(string memory _hhNumber, string memory _password) external view returns (bool) {
        require(isPatientRegistered[_hhNumber], "Patient not registered");
        return keccak256(abi.encodePacked(_password)) == keccak256(abi.encodePacked(patients[_hhNumber].password));
    }

    function getPatientDetails(string memory _hhNumber) external view returns (
        address walletAddress,
        string memory name,
        string memory dateOfBirth,
        string memory gender,
        string memory bloodGroup,
        string memory homeAddress,
        string memory email
    ) {
        require(isPatientRegistered[_hhNumber], "Patient not registered");
        Patient memory patient = patients[_hhNumber];
        return (patient.walletAddress, patient.name, patient.dateOfBirth, patient.gender, patient.bloodGroup, patient.homeAddress, patient.email);
    }

    function grantPermission(
        string memory _patientNumber,
        string memory _doctorNumber,
        string memory _patientName
    ) external {
        require(!doctorPermissions[_patientNumber][_doctorNumber], "View Access already given to the Doctor!");
        // Check if the patient number already exists in the list
        bool exists = false;
        for (uint i = 0; i < Dpermission[_doctorNumber].length; i++) {
            if (keccak256(abi.encodePacked(Dpermission[_doctorNumber][i].patient_number)) == keccak256(abi.encodePacked(_patientNumber))) {
                exists = true;
                break;
            }
        }

        // If the patient number does not exist, add it to the list
        if (!exists) {
            PatientList memory newRecord = PatientList(
                _patientNumber,
                _patientName
            );
            Dpermission[_doctorNumber].push(newRecord);
        }
        doctorPermissions[_patientNumber][_doctorNumber] = true;
    }

    function grantDoctorPermission(string memory patientHhNumber, string memory doctorHhNumber) public {
        require(isPatientRegistered[patientHhNumber], "Patient not registered");
        require(isDoctorRegistered[doctorHhNumber], "Doctor not registered");
        doctorPermissions[patientHhNumber][doctorHhNumber] = true;
    }

    function isPermissionGranted(string memory _patientNumber, string memory _doctorNumber) external view returns (bool) {
        return doctorPermissions[_patientNumber][_doctorNumber];
    }

    function getPatientList(string memory _doctorNumber) public view returns (PatientList[] memory) {
        return Dpermission[_doctorNumber];
    }

    function addPatientRecord(
        string memory _hhNumber,
        string memory _date,
        string memory _description,
        string memory _doctor
    ) external {
        require(isPatientRegistered[_hhNumber], "Patient not registered");

        uint recordId = patientRecords[_hhNumber].length + 1;
        Record memory newRecord = Record({
            id: recordId,
            date: _date,
            description: _description,
            doctor: _doctor
        });

        patientRecords[_hhNumber].push(newRecord);
        emit RecordAdded(_hhNumber, recordId, _date, _doctor);
    }

    function getPatientRecords(string memory _hhNumber) external view returns (Record[] memory) {
        require(isPatientRegistered[_hhNumber], "Patient not registered");
        return patientRecords[_hhNumber];
    }

    function uploadRecord(string memory hhNumber, string memory cid) public {
        require(isPatientRegistered[hhNumber], "Patient not registered");
        fileRecords[hhNumber].push(cid);
        emit RecordUploaded(hhNumber, cid);
    }

    function getFileRecords(string memory hhNumber) public view returns (string[] memory) {
        require(isPatientRegistered[hhNumber], "Patient not registered");
        return fileRecords[hhNumber];
    }

    function deleteFileRecord(string memory hhNumber, uint index) public {
        require(isPatientRegistered[hhNumber], "Patient not registered");
        require(index < fileRecords[hhNumber].length, "Invalid index");
        // Move the last element into the place to delete and pop
        fileRecords[hhNumber][index] = fileRecords[hhNumber][fileRecords[hhNumber].length - 1];
        fileRecords[hhNumber].pop();
    }

    function getAllPatients() public view returns (Patient[] memory) {
        Patient[] memory allPatients = new Patient[](registeredPatientCount);

        for (uint i = 0; i < patientHhNumbers.length; i++) {
            allPatients[i] = patients[patientHhNumbers[i]];
        }

        return allPatients;
    }

    function removePatient(string memory hhNumber) public {
        require(isPatientRegistered[hhNumber], "Patient not registered");

        // Delete the patient from the mapping
        delete patients[hhNumber];
        isPatientRegistered[hhNumber] = false;

        // Find and remove the hhNumber from the patientHhNumbers array
        bool found = false;
        for (uint i = 0; i < patientHhNumbers.length; i++) {
            if (keccak256(abi.encodePacked(patientHhNumbers[i])) == keccak256(abi.encodePacked(hhNumber))) {
                patientHhNumbers[i] = patientHhNumbers[patientHhNumbers.length - 1]; // Replace with the last element
                patientHhNumbers.pop(); // Remove the last element
                found = true;
                break;
            }
        }

        require(found, "Patient HH Number not found in the list");

        // Decrement the registered patient count
        registeredPatientCount--;
    }

    function registerDoctor(string memory doctorHhNumber) public {
        require(!isDoctorRegistered[doctorHhNumber], "Doctor already registered");
        isDoctorRegistered[doctorHhNumber] = true;
        // Optionally, store more doctor details here
    }

    function addPrescription(
        string memory _hhNumber,
        string memory _diagnosis,
        string memory _prescription,
        string memory _doctor
    ) public {
        require(isPatientRegistered[_hhNumber], "Patient not registered");

        uint recordId = patientRecords[_hhNumber].length + 1;
        string memory currentDate = ""; // Optionally pass date from frontend

        // Combine diagnosis and prescription into description
        string memory description = string(
            abi.encodePacked("Diagnosis: ", _diagnosis, "; Prescription: ", _prescription)
        );

        Record memory newRecord = Record({
            id: recordId,
            date: currentDate,
            description: description,
            doctor: _doctor
        });

        patientRecords[_hhNumber].push(newRecord);
        emit RecordAdded(_hhNumber, recordId, currentDate, _doctor);
    }
}
