const FormContainer = ({ children }) => {
  return (
    <div className="row justify-content-md-center">
      <div className="col-md-6">
        <div className="card p-4 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FormContainer; 