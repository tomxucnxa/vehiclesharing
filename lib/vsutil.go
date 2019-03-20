package lib

import (
	"fmt"
	"time"
)

// VSUtil for common usage
type VSUtil struct {
}

// GetTime as default
func (util *VSUtil) GetTime() string {
	return fmt.Sprintf(`Hello world from vsutil at %s`, time.Now())
}
