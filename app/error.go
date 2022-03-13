package app

type Error interface {
	error
	Status() int
	Error() string
}

type StatusError struct {
	Code int
	Err  error
}

func (se StatusError) Error() string {
	return se.Err.Error()
}

func (se StatusError) Status() int {
	return se.Code
}

func LogicError(err error) *StatusError {
	return &StatusError{
		Code: 400,
		Err:  err,
	}
}

func ServerError(err error) *StatusError {
	return &StatusError{
		Code: 500,
		Err:  err,
	}
}
