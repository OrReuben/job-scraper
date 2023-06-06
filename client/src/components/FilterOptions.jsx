/* eslint-disable react/prop-types */
import { useForm } from "react-hook-form";
import { styled } from "styled-components";
import { useSearchParams } from "react-router-dom";

const FilterOptions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsObj = Object.fromEntries([...searchParams]);

  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm();

  const onSubmit = (data) => {
    setSearchParams({ ...paramsObj, ...data });
  };

  const handleClear = () => {
    setValue("role", "");
    setValue("website", "");
    setSearchParams({})
  };
  return (
    <Container>
      <h2>חיפוש מהיר</h2>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <input type="text" placeholder="חיפוש חופשי" {...register("role")} />
          <input type="text" placeholder="חפש אתר" {...register("website")} />
          <button type="submit">חיפוש</button>
          <button type="button" onClick={handleClear}>
            נקה
          </button>
        </div>
        <p> {errors?.role?.message} </p>
      </Form>
    </Container>
  );
};

export default FilterOptions;

const Container = styled.section`
  background-color: #e8e9eb;
  padding: 0.5rem;
  position: sticky;
  top: 0;

  h2 {
    text-align: center;
    padding: 1rem 0;
    font-family: 700;
  }
`;
const Form = styled.form`
  max-width: 1000px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 15px;

  div {
    display: flex;
    gap: 20px;

    @media (max-width: 1300px) {
      display: grid;
      gap: 0.5rem;
      grid-template-columns: repeat(2, 1fr);
    }
  }
  input {
    border: none;
    padding: 0.75rem 1.25rem;

    @media (max-width: 1300px) {
      padding: 0.5rem 1rem;
    }
  }

  button {
    border: none;
    background-color: #fff;
    padding: 0.75rem 1.25rem;
    cursor: pointer;
    transition: all 0.25s;

    &:hover {
      color: white;
      background-color: black;
    }

    @media (max-width: 1300px) {
      padding: 0.5rem 1rem;
    }
  }
  p {
    color: red;
    font-weight: 700;
  }
`;
