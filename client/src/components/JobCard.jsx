/* eslint-disable react/prop-types */
import { useState } from "react";
import { styled, css } from "styled-components";

const JobCard = ({ job }) => {
  const [isCardShown, setIsCardShown] = useState(false);

  return (
    <CardContainer $isCardShown={isCardShown}>
      <h1>{job.title}</h1>
      <div className="job-details">
        <span>
          <b>אתר: </b> {job.website}
        </span>
        <strong>|</strong>
        <span>
          <b>איזור:</b> {job.location}
        </span>
        <strong>|</strong>
        <span>
          <b>סוג משרה: </b>
          {job.type}
        </span>
        <strong>|</strong>
      </div>
      <div className="job-description">
        <h3>תיאור המשרה: </h3>
        <p>{job.description}</p>
      </div>
      {isCardShown && (
        <div className="job-requirements">
          <h3> דרישות המשרה: </h3>
          <p>{job.requirements}</p>
        </div>
      )}
      <div>
        <div className="job-actions">
          <button onClick={() => setIsCardShown((prev) => !prev)}>
            {isCardShown ? "- להסתרת פרטי המשרה" : "+ לצפייה בפרטי המשרה"}
          </button>
          <a target="_blank" rel="noreferrer" href={job.link}>
            למשרה באתר
          </a>
        </div>
      </div>
    </CardContainer>
  );
};

export default JobCard;

const CardContainer = styled.div`
  max-width: 600px;
  background-color: white;
  border-right: 9px solid #ff7100;
  box-shadow: 0 0 5px 0 rgba(156, 153, 153, 0.46);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;

  @media (max-width: 1300px) {
    width: 100%;
    max-width: none;
  }
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ff7100;
  }

  .job-details {
    display: flex;
    align-items: center;
    gap: 1rem;

    ${(props) =>
      !props.$isCardShown &&
      css`
        span:not(:first-child) {
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }
      `}

    @media (max-width: 700px) {
      b {
        display: none;
      }
    }
  }

  .job-description {
    ${(props) =>
      !props.$isCardShown &&
      css`
        p {
          height: 60px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          line-height: 1.5rem;
          padding: 0.5rem 0;
        }
      `}
  }

  .job-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 95%;

    button {
      outline: none;
      border: none;
      font-size: 1rem;
      padding: 0.25rem 1rem;
      background-color: #ff7100;
      border-radius: 10px;
      color: white;
      cursor: pointer;

      @media (max-width: 1300px) {
        font-size: 0.85rem;
        padding: 5px 10px;
      }
    }
    a {
      text-decoration: none;
      color: white;
      background-color: rgb(28 175 107);
      padding: 0.25rem 1.25rem;
      border-radius: 15px;
      @media (max-width: 1300px) {
        font-size: 0.85rem;
        padding: 5px 10px;
      }
    }
  }
`;
