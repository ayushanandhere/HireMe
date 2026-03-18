const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Candidate = require('../models/candidateModel');
const Recruiter = require('../models/recruiterModel');
const Job = require('../models/jobModel');
const Application = require('../models/applicationModel');
const Interview = require('../models/interviewModel');
const Notification = require('../models/notificationModel');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hireme';

const DEMO_RECRUITER_EMAILS = ['recruiter@hireme.co'];
const DEMO_CANDIDATE_EMAILS = ['candidate@hireme.co', 'candidate2@hireme.co'];

const removeDemoData = async () => {
  await mongoose.connect(MONGODB_URI);

  const recruiters = await Recruiter.find({ email: { $in: DEMO_RECRUITER_EMAILS } }).select('_id');
  const candidates = await Candidate.find({ email: { $in: DEMO_CANDIDATE_EMAILS } }).select('_id');

  const recruiterIds = recruiters.map((recruiter) => recruiter._id);
  const candidateIds = candidates.map((candidate) => candidate._id);

  const jobs = await Job.find({ recruiter: { $in: recruiterIds } }).select('_id');
  const jobIds = jobs.map((job) => job._id);
  const applications = await Application.find({
    $or: [
      { candidate: { $in: candidateIds } },
      { job: { $in: jobIds } },
      { createdBy: { $in: candidateIds } }
    ]
  }).select('_id');
  const applicationIds = applications.map((application) => application._id);
  const interviews = await Interview.find({
    $or: [
      { candidate: { $in: candidateIds } },
      { recruiter: { $in: recruiterIds } },
      { applicationId: { $in: applicationIds } }
    ]
  }).select('_id');
  const interviewIds = interviews.map((interview) => interview._id);

  const applicationResult = await Application.deleteMany({
    $or: [
      { candidate: { $in: candidateIds } },
      { job: { $in: jobIds } },
      { createdBy: { $in: candidateIds } }
    ]
  });

  const interviewResult = await Interview.deleteMany({
    $or: [
      { candidate: { $in: candidateIds } },
      { recruiter: { $in: recruiterIds } },
      { applicationId: { $in: applicationIds } }
    ]
  });

  const notificationResult = await Notification.deleteMany({
    $or: [
      { recipient: { $in: candidateIds } },
      { recipient: { $in: recruiterIds } },
      { 'relatedTo.id': { $in: interviewIds } }
    ]
  });

  const jobResult = await Job.deleteMany({ _id: { $in: jobIds } });
  const candidateResult = await Candidate.deleteMany({ _id: { $in: candidateIds } });
  const recruiterResult = await Recruiter.deleteMany({ _id: { $in: recruiterIds } });

  console.log(
    JSON.stringify(
      {
        applicationsDeleted: applicationResult.deletedCount,
        interviewsDeleted: interviewResult.deletedCount,
        notificationsDeleted: notificationResult.deletedCount,
        jobsDeleted: jobResult.deletedCount,
        candidatesDeleted: candidateResult.deletedCount,
        recruitersDeleted: recruiterResult.deletedCount
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
};

removeDemoData().catch(async (error) => {
  console.error('Failed to remove demo data:', error);
  await mongoose.disconnect();
  process.exit(1);
});
