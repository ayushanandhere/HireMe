import React, { useState } from 'react';
import { 
  Card, Row, Col, Badge, ListGroup, Alert, OverlayTrigger, Tooltip, 
  Button, ProgressBar, Accordion
} from 'react-bootstrap';
import { 
  FaCheckCircle, FaExclamationTriangle, FaProjectDiagram, FaUserTie, 
  FaChartLine, FaBrain, FaChartBar, FaArrowUp, FaArrowDown, FaStar, FaStarHalfAlt, FaRegStar,
  FaInfoCircle, FaTrophy, FaGraduationCap, FaHandshake, FaLightbulb, FaCode
} from 'react-icons/fa';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import '../styles/EnhancedResumeAnalysis.css';

const EnhancedResumeAnalysis = ({ enhancedAnalysis, resumeSource }) => {
  // State for explanation toggle
  const [showExplanation, setShowExplanation] = useState(false);
  
  if (!enhancedAnalysis) {
    return (
      <Alert variant="info">
        No enhanced analysis available. Try parsing the resume again.
      </Alert>
    );
  }

  const { 
    candidateRoleFit, 
    skillProficiency, 
    softSkills, 
    projectRelevance, 
    strengthsWeaknesses, 
    redFlags 
  } = enhancedAnalysis;

  // Format data for radar chart
  const radarData = skillProficiency ? skillProficiency.map(skill => ({
    subject: skill.skill,
    A: skill.rating,
    fullMark: 10
  })) : [];

  // Prepare data for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Prepare data for skills bar chart
  const skillBarData = skillProficiency?.map(item => ({
    name: item.skill,
    value: item.rating,
  })) || [];

  // Helper function to get gradient background based on fit score
  const getFitScoreGradient = (score) => {
    if (score >= 80) {
      return 'linear-gradient(135deg, #43a047, #66bb6a)';
    } else if (score >= 60) {
      return 'linear-gradient(135deg, #1e88e5, #42a5f5)';
    } else if (score >= 40) {
      return 'linear-gradient(135deg, #fb8c00, #ffa726)';
    } else {
      return 'linear-gradient(135deg, #e53935, #ef5350)';
    }
  };

  // Helper function to get color for fit score - used for text and borders
  const getFitScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#2196f3';
    if (score >= 40) return '#ff9800';
    return '#f44336';
  };
  
  // Helper function to get icon for soft skill
  const getSoftSkillIcon = (index) => {
    const icons = [
      <FaBrain key="brain" />,
      <FaHandshake key="handshake" />,
      <FaLightbulb key="lightbulb" />,
      <FaInfoCircle key="info" />,
      <FaTrophy key="trophy" />,
      <FaGraduationCap key="graduation" />
    ];
    return icons[index % icons.length];
  };

  // Star Rating Component
  const StarRating = ({ rating }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`star-${i}`} className="star-icon filled" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="star-half" className="star-icon half" />);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`star-empty-${i}`} className="star-icon empty" />);
    }
    
    return <div className="star-rating">{stars}</div>;
  };

  return (
    <div className="enhanced-resume-analysis">
      {/* Resume Source Indicator */}
      {resumeSource && (
        <Alert variant="info" className="resume-source-alert mb-3">
          <FaInfoCircle className="me-2" />
          <strong>Resume Source:</strong> {resumeSource === 'job-specific' ? 
            'Job-specific resume uploaded for this application' : 
            'Candidate\'s generic resume (no job-specific resume uploaded)'}
        </Alert>
      )}
      <Row className="mb-4">
        <Col md={4}>
          {/* Candidate-Role Fit Score */}
          <Card className="fit-score-card h-100">
            <Card.Body className="text-center">
              <h5 className="mb-3 section-title">
                <FaUserTie className="section-icon" />
                Candidate-Role Fit
              </h5>
              <div className="fit-score-container">
                <div 
                  className="fit-score-circle" 
                  style={{ background: getFitScoreGradient(candidateRoleFit?.score || 0) }}
                >
                  <span className="fit-score">{candidateRoleFit?.score || 0}</span>
                  <span className="fit-score-label">/ 100</span>
                </div>
              </div>
              <div className="fit-score-rating mt-3">
                {candidateRoleFit?.score >= 80 && (
                  <Badge bg="success" className="fit-rating-badge">Excellent Match</Badge>
                )}
                {candidateRoleFit?.score >= 60 && candidateRoleFit?.score < 80 && (
                  <Badge bg="primary" className="fit-rating-badge">Good Match</Badge>
                )}
                {candidateRoleFit?.score >= 40 && candidateRoleFit?.score < 60 && (
                  <Badge bg="warning" className="fit-rating-badge">Fair Match</Badge>
                )}
                {candidateRoleFit?.score < 40 && (
                  <Badge bg="danger" className="fit-rating-badge">Poor Match</Badge>
                )}
              </div>
              <div className="fit-explanation-container mt-3">
                <Button 
                  variant="link" 
                  className="explanation-toggle" 
                  onClick={() => setShowExplanation(!showExplanation)}
                >
                  {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
                </Button>
                {showExplanation && (
                  <div className="fit-score-explanation">
                    {candidateRoleFit?.explanation || 'No explanation available'}
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          {/* Skill Proficiency Visualization */}
          <Card className="skill-proficiency-card h-100">
            <Card.Body>
              <h5 className="mb-3 section-title">
                <FaChartLine className="section-icon" />
                Top Skill Proficiency
              </h5>
              {skillProficiency && skillProficiency.length > 0 ? (
                <div className="skill-visualization-container">
                  <Row>
                    <Col md={7}>
                      <div className="radar-chart-container">
                        <ResponsiveContainer width="100%" height={250}>
                          <RadarChart outerRadius={90} data={radarData}>
                            <PolarGrid strokeDasharray="3 3" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#555', fontSize: 12 }} />
                            <PolarRadiusAxis domain={[0, 10]} tick={{ fill: '#666' }} />
                            <Radar
                              name="Skills"
                              dataKey="A"
                              stroke="#8884d8"
                              fill="#8884d8"
                              fillOpacity={0.6}
                            />
                            <RechartsTooltip formatter={(value) => [`${value}/10`, 'Rating']} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </Col>
                    <Col md={5}>
                      <div className="skill-ratings-list">
                        {skillProficiency.map((skill, index) => (
                          <div className="skill-rating-item" key={`skill-rating-${index}`}>
                            <div className="skill-rating-header">
                              <span className="skill-name">{skill.skill}</span>
                              <span className="skill-value">{skill.rating}/10</span>
                            </div>
                            <div className="skill-rating-stars">
                              <StarRating rating={skill.rating / 2} />
                            </div>
                            <ProgressBar 
                              now={skill.rating * 10} 
                              variant={skill.rating >= 8 ? 'success' : skill.rating >= 6 ? 'info' : skill.rating >= 4 ? 'warning' : 'danger'} 
                              className="skill-progress" 
                            />
                          </div>
                        ))}
                      </div>
                    </Col>
                  </Row>
                </div>
              ) : (
                <p className="text-muted">No skill proficiency data available</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          {/* Soft Skills */}
          <Card className="soft-skills-card h-100">
            <Card.Body>
              <h5 className="mb-3 section-title">
                <FaBrain className="section-icon" />
                Inferred Soft Skills
              </h5>
              {softSkills && softSkills.length > 0 ? (
                <div className="soft-skills-container">
                  {softSkills.map((skill, index) => (
                    <Card 
                      key={`soft-skill-${index}`} 
                      className="soft-skill-card animate-on-hover"
                    >
                      <Card.Body>
                        <div className="soft-skill-icon-container">
                          <div className="soft-skill-icon-wrapper">
                            {getSoftSkillIcon(index)}
                          </div>
                        </div>
                        <h6 className="soft-skill-title">{skill.skill}</h6>
                        <div className="soft-skill-justification">
                          <p>{skill.justification}</p>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaBrain className="empty-icon" />
                  <p className="text-muted mt-2">No soft skills data available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          {/* Project Relevance */}
          <Card className="project-relevance-card h-100">
            <Card.Body>
              <h5 className="mb-3 section-title">
                <FaProjectDiagram className="section-icon" />
                Project Relevance
              </h5>
              {projectRelevance && projectRelevance.length > 0 ? (
                <div className="project-relevance-container">
                  {projectRelevance.map((project, index) => {
                    // Calculate color based on score
                    const scoreColor = project.relevanceScore >= 8 ? '#4caf50' : 
                                       project.relevanceScore >= 6 ? '#2196f3' : 
                                       project.relevanceScore >= 4 ? '#ff9800' : '#f44336';
                    
                    return (
                      <div 
                        className="project-item animate-on-hover" 
                        key={`project-${index}`}
                        style={{ borderLeftColor: scoreColor }}
                      >
                        <div className="project-header">
                          <h6 className="project-title">
                            <FaProjectDiagram className="me-2" style={{ color: scoreColor }} />
                            {project.title}
                          </h6>
                          <div className="project-score-container">
                            <div className="project-score-circle" style={{ background: scoreColor }}>
                              {project.relevanceScore}
                            </div>
                          </div>
                        </div>
                        <div className="project-content">
                          <div className="project-score-bar">
                            <div 
                              className="project-score-fill" 
                              style={{ 
                                width: `${project.relevanceScore * 10}%`,
                                backgroundColor: scoreColor 
                              }}
                            ></div>
                          </div>
                          <p className="project-reasoning mt-2">{project.reasoning}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaProjectDiagram className="empty-icon" />
                  <p className="text-muted mt-2">No project relevance data available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          {/* Strengths & Weaknesses */}
          <Card className="strengths-weaknesses-card h-100">
            <Card.Body>
              <h5 className="mb-3 section-title">
                <FaChartBar className="section-icon" />
                Strengths & Weaknesses
              </h5>
              
              {/* Visualization of strengths vs weaknesses */}
              {strengthsWeaknesses?.strengths && strengthsWeaknesses?.weaknesses && (
                <div className="sw-visualization mb-4">
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart
                      layout="vertical"
                      data={[
                        {
                          name: 'Balance',
                          strengths: strengthsWeaknesses.strengths.length,
                          weaknesses: strengthsWeaknesses.weaknesses.length
                        }
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, Math.max(5, strengthsWeaknesses.strengths.length + strengthsWeaknesses.weaknesses.length)]} />
                      <YAxis type="category" dataKey="name" hide />
                      <RechartsTooltip />
                      <Legend verticalAlign="top" />
                      <Bar dataKey="strengths" name="Strengths" fill="#4caf50" radius={[4, 0, 0, 4]} />
                      <Bar dataKey="weaknesses" name="Weaknesses" fill="#f44336" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              <Accordion defaultActiveKey="0" className="sw-accordion">
                <Accordion.Item eventKey="0" className="strengths-accordion">
                  <Accordion.Header>
                    <div className="d-flex align-items-center">
                      <div className="accordion-icon-wrapper strength-icon">
                        <FaCheckCircle />
                      </div>
                      <span className="ms-2">Strengths</span>
                      {strengthsWeaknesses?.strengths && (
                        <Badge bg="success" pill className="ms-2">{strengthsWeaknesses.strengths.length}</Badge>
                      )}
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    {strengthsWeaknesses?.strengths && strengthsWeaknesses.strengths.length > 0 ? (
                      <div className="strengths-list">
                        {strengthsWeaknesses.strengths.map((strength, index) => (
                          <div key={`strength-${index}`} className="strength-item animate-on-hover">
                            <div className="strength-icon-container">
                              <FaArrowUp className="strength-arrow" />
                            </div>
                            <div className="strength-content">
                              {strength}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No strengths data available</p>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="1" className="weaknesses-accordion">
                  <Accordion.Header>
                    <div className="d-flex align-items-center">
                      <div className="accordion-icon-wrapper weakness-icon">
                        <FaExclamationTriangle />
                      </div>
                      <span className="ms-2">Weaknesses</span>
                      {strengthsWeaknesses?.weaknesses && (
                        <Badge bg="danger" pill className="ms-2">{strengthsWeaknesses.weaknesses.length}</Badge>
                      )}
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    {strengthsWeaknesses?.weaknesses && strengthsWeaknesses.weaknesses.length > 0 ? (
                      <div className="weaknesses-list">
                        {strengthsWeaknesses.weaknesses.map((weakness, index) => (
                          <div key={`weakness-${index}`} className="weakness-item animate-on-hover">
                            <div className="weakness-icon-container">
                              <FaArrowDown className="weakness-arrow" />
                            </div>
                            <div className="weakness-content">
                              {weakness}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No weaknesses data available</p>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          {/* Red Flags */}
          <Card className="red-flags-card h-100">
            <Card.Body>
              <h5 className="mb-3 section-title">
                <FaExclamationTriangle className="section-icon text-danger" />
                Potential Red Flags
              </h5>
              
              {redFlags && redFlags.length > 0 ? (
                <div className="red-flags-container">
                  <div className="red-flags-severity">
                    <div className="severity-meter">
                      <div 
                        className="severity-fill" 
                        style={{ width: `${Math.min(100, redFlags.length * 20)}%` }}
                      ></div>
                      <div className="severity-label">
                        {redFlags.length > 4 ? 'High' : redFlags.length > 2 ? 'Medium' : 'Low'} Severity
                      </div>
                    </div>
                  </div>
                  
                  <div className="red-flags-list">
                    {redFlags.map((flag, index) => (
                      <div key={`flag-${index}`} className="red-flag-item animate-on-hover">
                        <div className="red-flag-icon">
                          <FaExclamationTriangle />
                        </div>
                        <div className="red-flag-content">
                          {flag}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-red-flags">
                  <div className="success-icon-container">
                    <FaCheckCircle className="success-icon" />
                  </div>
                  <h6 className="mt-3">No Red Flags Detected</h6>
                  <p className="text-muted">This candidate doesn't have any significant concerns for this role.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EnhancedResumeAnalysis;
