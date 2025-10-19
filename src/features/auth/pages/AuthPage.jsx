import { Github } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import logo from '/icons/logo.svg';

import Button from '@/components/auth/Button';
import CustomSelect from '@/components/auth/CustomSelect';
import Input from '@/components/auth/Input';
import Modal from '@/components/auth/Modal';
import {
  POSITION_OPTIONS,
  DEPARTMENT_OPTIONS,
  POSITION_MAP,
  DEPARTMENT_MAP,
} from '@/constants/accounts';
import { useAuth } from '@/hooks/useAuth';

import * as S from './AuthPage.styles';

export default function AuthPage() {
  const location = useLocation();
  const { loginWithGithub, completeRegistration } = useAuth();
  const [step, setStep] = useState(1);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [signToken, setSignToken] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    position: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    department: '',
    position: '',
    submit: '',
  });
  const [touched, setTouched] = useState({
    name: false,
    department: false,
    position: false,
  });

  // AuthCallback에서 회원가입 필요 시 SignToken과 함께 리다이렉트
  useEffect(() => {
    // URL state에서 회원가입 필요 여부 확인
    if (location.state?.requiresSignup) {
      const token = sessionStorage.getItem('sign_token');
      if (token) {
        setSignToken(token);
        setStep(2);
      }
    }
  }, [location]);

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z가-힣\s]{2,30}$/;
    if (!name) return '이름을 입력해주세요';
    if (!nameRegex.test(name))
      return '이름은 2~30자의 한글 또는 영문이어야 합니다';
    return '';
  };

  const validateDepartment = (department) => {
    if (!department) return '부서를 선택해주세요';
    return '';
  };

  const validatePosition = (position) => {
    if (!position) return '직급을 선택해주세요';
    return '';
  };

  const handleGithubLogin = () => {
    // GitHub OAuth 페이지로 리다이렉트
    loginWithGithub();
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });

    // 실시간 validation (모든 키 입력마다)
    let error = '';
    if (field === 'name') error = validateName(value);
    if (field === 'department') error = validateDepartment(value);
    if (field === 'position') error = validatePosition(value);

    setErrors({ ...errors, [field]: error });

    // 자동으로 touched 상태 업데이트
    setTouched({ ...touched, [field]: true });
  };

  const handleBlur = (field) => {
    // Blur 시에도 touched 업데이트 (이미 onChange에서 처리되지만 일관성 유지)
    setTouched({ ...touched, [field]: true });
  };

  const handleSubmit = async () => {
    const nameError = validateName(formData.name);
    const departmentError = validateDepartment(formData.department);
    const positionError = validatePosition(formData.position);

    setErrors({
      name: nameError,
      department: departmentError,
      position: positionError,
      submit: '',
    });

    setTouched({
      name: true,
      department: true,
      position: true,
    });

    if (!nameError && !departmentError && !positionError) {
      // SignToken 존재 확인
      if (!signToken) {
        setErrors({
          ...errors,
          submit: '인증 정보가 없습니다. 다시 로그인해주세요.',
        });
        setTimeout(() => {
          setStep(1);
          setErrors({ name: '', department: '', position: '', submit: '' });
        }, 3000);
        return;
      }

      setShowLoadingModal(true);

      try {
        // 한글 → 영문 매핑
        const mappedPosition = POSITION_MAP[formData.position];
        const mappedDepartment = DEPARTMENT_MAP[formData.department];

        // SignToken과 회원가입 정보로 실제 API 호출
        await completeRegistration(
          {
            name: formData.name,
            department: mappedDepartment,
            position: mappedPosition,
          },
          signToken,
        );

        // 성공 시 sessionStorage의 signToken 제거
        sessionStorage.removeItem('sign_token');
      } catch (error) {
        console.error('회원가입 에러:', error);
        setShowLoadingModal(false);

        // 401: SignToken 만료
        if (error.response?.status === 401) {
          sessionStorage.removeItem('sign_token');
          setErrors({
            name: '',
            department: '',
            position: '',
            submit:
              '인증 시간이 만료되었습니다. GitHub 로그인을 다시 진행해주세요.',
          });
          setTimeout(() => {
            setStep(1);
            setErrors({ name: '', department: '', position: '', submit: '' });
          }, 3000);
        }
        // 400: 입력 데이터 오류
        else if (error.response?.status === 400) {
          setErrors({
            ...errors,
            submit: error.response.data?.message || '입력 정보를 확인해주세요.',
          });
        }
        // 기타 에러
        else {
          setErrors({
            ...errors,
            submit: '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.',
          });
        }
      }
    }
  };

  return (
    <S.PageContainer>
      <S.GradientBackground />

      <S.MainContainer>
        <S.Card>
          {/* Step 1: GitHub OAuth */}
          {step === 1 && (
            <S.StepContainer>
              <S.HeaderSection>
                <S.Logo src={logo} alt="BE4MAN Logo" />
              </S.HeaderSection>

              <S.WelcomeSection>
                <S.WelcomeTitle>배포맨</S.WelcomeTitle>
                <S.WelcomeText>
                  안정적인 CI/CD 배포 환경 관리 서비스
                </S.WelcomeText>
              </S.WelcomeSection>

              <S.GithubButtonWrapper>
                <Button
                  variant="github"
                  size="lg"
                  fullWidth
                  onClick={handleGithubLogin}
                >
                  <Github size={24} />
                  깃허브 로그인
                </Button>
              </S.GithubButtonWrapper>
            </S.StepContainer>
          )}

          {/* Step 2: User Information Form */}
          {step === 2 && (
            <S.StepContainer>
              <S.FormSection>
                <S.FormTitle>회원가입</S.FormTitle>
              </S.FormSection>

              <S.FormFields>
                <Input
                  label="이름"
                  type="text"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  error={touched.name ? errors.name : ''}
                  size="lg"
                />

                <CustomSelect
                  label="부서"
                  value={formData.department}
                  onChange={(value) => handleInputChange('department', value)}
                  onBlur={() => handleBlur('department')}
                  options={DEPARTMENT_OPTIONS}
                  error={touched.department ? errors.department : ''}
                  size="lg"
                />

                <CustomSelect
                  label="직급"
                  value={formData.position}
                  onChange={(value) => handleInputChange('position', value)}
                  onBlur={() => handleBlur('position')}
                  options={POSITION_OPTIONS}
                  error={touched.position ? errors.position : ''}
                  size="lg"
                />

                {/* Submit 에러 메시지 */}
                {errors.submit && (
                  <S.SubmitErrorMessage>{errors.submit}</S.SubmitErrorMessage>
                )}
              </S.FormFields>

              <S.ButtonGroup>
                <Button
                  variant="cancel"
                  size="lg"
                  onClick={() => {
                    // 취소 시 sessionStorage에서 signToken 제거
                    sessionStorage.removeItem('sign_token');
                    setSignToken(null);
                    setStep(1);
                  }}
                >
                  취소
                </Button>
                <Button variant="primary" size="lg" onClick={handleSubmit}>
                  가입
                </Button>
              </S.ButtonGroup>
            </S.StepContainer>
          )}
        </S.Card>
      </S.MainContainer>

      {/* Loading Modal */}
      <Modal
        isOpen={showLoadingModal}
        onClose={() => {}} // 모달을 닫지 않음
        showCloseButton={false}
        closeOnOverlayClick={false}
      >
        <S.LoadingSpinner />
        <S.ModalTitle>가입 완료!</S.ModalTitle>
        <S.ModalText>배포 페이지로 이동 중...</S.ModalText>
      </Modal>
    </S.PageContainer>
  );
}
