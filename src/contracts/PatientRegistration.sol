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
        string ipfsHash; // <-- Added for file support
    }

    struct DoctorInfo {
        string doctorNumber;
        string doctorName;
        address walletAddress;
    }

    mapping(string => bool) public isPatientRegistered;
    mapping(string => Patient) public patients;
    mapping(string => PatientList[]) private Dpermission;
    mapping(string => mapping(string => bool)) public doctorPermissions;
    mapping(string => Record[]) private patientRecords;
    mapping(string => DoctorInfo) private doctorInfoByNumber;
    mapping(string => bool) private isDoctorInfoRegistered;

    string[] private patientHhNumbers;
    DoctorInfo[] private doctorInfoList;
    uint public registeredPatientCount;

    event PatientRegistered(string hhNumber, string name, address walletAddress);
    event RecordAdded(string hhNumber, uint recordId, string date, string doctor, string ipfsHash); // <-- Updated

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
        patientHhNumbers.push(_hhNumber);
        registeredPatientCount++;
        emit PatientRegistered(_hhNumber, _name, _walletAddress);
    }

    function isRegisteredPatient(string memory _hhNumber) external view returns (bool) {
        return isPatientRegistered[_hhNumber];
    }

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
        bool exists = false;
        for (uint i = 0; i < Dpermission[_doctorNumber].length; i++) {
            if (keccak256(abi.encodePacked(Dpermission[_doctorNumber][i].patient_number)) == keccak256(abi.encodePacked(_patientNumber))) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            PatientList memory newRecord = PatientList(
                _patientNumber,
                _patientName
            );
            Dpermission[_doctorNumber].push(newRecord);
        }
        doctorPermissions[_patientNumber][_doctorNumber] = true;
    }

    function isPermissionGranted(string memory _patientNumber, string memory _doctorNumber) external view returns (bool) {
        return doctorPermissions[_patientNumber][_doctorNumber];
    }

    function getPatientList(string memory _doctorNumber) public view returns (PatientList[] memory) {
        return Dpermission[_doctorNumber];
    }

    // Old version (for backward compatibility)
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
            doctor: _doctor,
            ipfsHash: "" // No file for legacy calls
        });

        patientRecords[_hhNumber].push(newRecord);
        emit RecordAdded(_hhNumber, recordId, _date, _doctor, "");
    }

    // New version (with IPFS hash)
    function addPatientRecord(
        string memory _hhNumber,
        string memory _date,
        string memory _description,
        string memory _doctor,
        string memory _ipfsHash
    ) external {
        require(isPatientRegistered[_hhNumber], "Patient not registered");

        uint recordId = patientRecords[_hhNumber].length + 1;
        Record memory newRecord = Record({
            id: recordId,
            date: _date,
            description: _description,
            doctor: _doctor,
            ipfsHash: _ipfsHash
        });

        patientRecords[_hhNumber].push(newRecord);
        emit RecordAdded(_hhNumber, recordId, _date, _doctor, _ipfsHash);
    }

    function deletePatientRecord(string memory _hhNumber, uint _index) public {
        require(isPatientRegistered[_hhNumber], "Patient not registered");
        require(_index < patientRecords[_hhNumber].length, "Invalid record index");
        // Only allow the patient or contract owner to delete (optional: add your own access control)
        // require(msg.sender == patients[_hhNumber].walletAddress, "Not authorized");

        // Move the last record to the deleted spot to maintain array continuity, then pop
        uint lastIndex = patientRecords[_hhNumber].length - 1;
        if (_index != lastIndex) {
            patientRecords[_hhNumber][_index] = patientRecords[_hhNumber][lastIndex];
        }
        patientRecords[_hhNumber].pop();
    }

    function getPatientRecords(string memory _hhNumber) external view returns (Record[] memory) {
        require(isPatientRegistered[_hhNumber], "Patient not registered");
        return patientRecords[_hhNumber];
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
        delete patients[hhNumber];
        isPatientRegistered[hhNumber] = false;
        bool found = false;
        for (uint i = 0; i < patientHhNumbers.length; i++) {
            if (keccak256(abi.encodePacked(patientHhNumbers[i])) == keccak256(abi.encodePacked(hhNumber))) {
                patientHhNumbers[i] = patientHhNumbers[patientHhNumbers.length - 1];
                patientHhNumbers.pop();
                found = true;
                break;
            }
        }
        require(found, "Patient HH Number not found in the list");
        registeredPatientCount--;
    }

    function registerDoctorInfo(
        string memory _doctorNumber,
        string memory _doctorName,
        address _walletAddress
    ) public {
        require(!isDoctorInfoRegistered[_doctorNumber], "Doctor already registered");
        DoctorInfo memory doc = DoctorInfo(_doctorNumber, _doctorName, _walletAddress);
        doctorInfoByNumber[_doctorNumber] = doc;
        isDoctorInfoRegistered[_doctorNumber] = true;
        doctorInfoList.push(doc);
    }

    function getAllDoctorInfo() public view returns (DoctorInfo[] memory) {
        return doctorInfoList;
    }
}
