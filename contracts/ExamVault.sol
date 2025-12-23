// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {LocalConfig} from "./LocalConfig.sol";

/**
 * @title ExamVault
 * @notice A privacy-preserving exam answer submission system using FHE
 * @dev Students submit encrypted answers that can only be decrypted by authorized parties
 */
contract ExamVault is LocalConfig {
    // Struct to store exam submission data
    struct Submission {
        address student;
        string examTitle;
        euint64 encryptedAnswer; // FHE encrypted answer (stored as uint64 for simplicity)
        uint256 timestamp;
        bool exists;
    }

    // Mapping from submission ID to Submission
    mapping(uint256 => Submission) public submissions;
    
    // Mapping from student address to their submission IDs
    mapping(address => uint256[]) public studentSubmissions;
    
    // Counter for submission IDs
    uint256 public submissionCount;
    
    // Events
    event SubmissionCreated(
        uint256 indexed submissionId,
        address indexed student,
        string examTitle,
        uint256 timestamp
    );
    
    event AnswerDecrypted(
        uint256 indexed submissionId,
        address indexed requester
    );

    /**
     * @notice Submit an encrypted exam answer
     * @param _examTitle The title of the exam
     * @param _encryptedAnswer The encrypted answer as euint64
     * @param inputProof The proof for the encrypted input
     */
    function submitAnswer(
        string calldata _examTitle,
        externalEuint64 _encryptedAnswer,
        bytes calldata inputProof
    ) external returns (uint256) {
        // Validate input
        require(bytes(_examTitle).length > 0, "Exam title cannot be empty");
        
        // Convert encrypted input to euint64
        euint64 answer = FHE.fromExternal(_encryptedAnswer, inputProof);
        
        // Allow the contract to use this encrypted value
        FHE.allow(answer, address(this));
        
        // Allow the student to decrypt their own answer
        FHE.allow(answer, msg.sender);
        
        // Create submission
        uint256 submissionId = submissionCount++;
        
        submissions[submissionId] = Submission({
            student: msg.sender,
            examTitle: _examTitle,
            encryptedAnswer: answer,
            timestamp: block.timestamp,
            exists: true
        });
        
        // Track student's submissions
        studentSubmissions[msg.sender].push(submissionId);
        
        emit SubmissionCreated(
            submissionId,
            msg.sender,
            _examTitle,
            block.timestamp
        );
        
        return submissionId;
    }

    /**
     * @notice Get submission details (without decrypted answer)
     * @param _submissionId The ID of the submission
     */
    function getSubmission(uint256 _submissionId)
        external
        view
        returns (
            address student,
            string memory examTitle,
            uint256 timestamp,
            bool exists
        )
    {
        Submission memory sub = submissions[_submissionId];
        return (sub.student, sub.examTitle, sub.timestamp, sub.exists);
    }

    /**
     * @notice Get all submission IDs for a student
     * @param _student The student's address
     */
    function getStudentSubmissions(address _student)
        external
        view
        returns (uint256[] memory)
    {
        return studentSubmissions[_student];
    }

    /**
     * @notice Get the encrypted answer handle for decryption
     * @param _submissionId The ID of the submission
     * @dev Only the student who submitted can request decryption
     */
    function getEncryptedAnswer(uint256 _submissionId)
        external
        view
        returns (euint64)
    {
        Submission memory sub = submissions[_submissionId];
        require(sub.exists, "Submission does not exist");
        require(
            sub.student == msg.sender,
            "Only the student can view their answer"
        );
        
        return sub.encryptedAnswer;
    }

    /**
     * @notice Request decryption of an answer (for authorized users)
     * @param _submissionId The ID of the submission
     * @dev Only the student who submitted can request decryption
     * @dev Decryption happens client-side using the FHE SDK
     * @dev This function re-authorizes the user to decrypt their answer
     */
    function requestDecryption(uint256 _submissionId) external returns (euint64) {
        Submission storage sub = submissions[_submissionId];
        require(sub.exists, "Submission does not exist");
        require(
            sub.student == msg.sender,
            "Only the student can decrypt their answer"
        );
        
        // Re-authorize the user to decrypt (required for FHEVM)
        FHE.allow(sub.encryptedAnswer, msg.sender);
        
        // Return the encrypted handle for client-side decryption
        return sub.encryptedAnswer;
    }

    /**
     * @notice Get total number of submissions
     */
    function getTotalSubmissions() external view returns (uint256) {
        return submissionCount;
    }

    /**
     * @notice Check if a submission exists
     * @param _submissionId The ID to check
     */
    function submissionExists(uint256 _submissionId)
        external
        view
        returns (bool)
    {
        return submissions[_submissionId].exists;
    }
}
