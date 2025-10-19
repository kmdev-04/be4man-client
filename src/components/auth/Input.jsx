import React from 'react';

import * as S from './Input.styles';

export const Input = React.forwardRef(
  ({ label, error, helperText, size = 'md', ...props }, ref) => {
    const hasError = !!error;

    return (
      <S.InputWrapper>
        <S.InputContainer>
          {label && <S.Label>{label}</S.Label>}
          <S.StyledInput
            ref={ref}
            $hasError={hasError}
            size={size}
            {...props}
          />
        </S.InputContainer>
        {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
        {!error && helperText && <S.HelperText>{helperText}</S.HelperText>}
      </S.InputWrapper>
    );
  },
);

Input.displayName = 'Input';

export default Input;
