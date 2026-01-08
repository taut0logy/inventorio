<?php

namespace App\Form;

use App\Entity\User;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\Form\Extension\Core\Type\RepeatedType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\Email;
use Symfony\Component\Validator\Constraints\IsTrue;
use Symfony\Component\Validator\Constraints\Length;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Validator\Constraints\Regex;

class RegistrationFormType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name', TextType::class, [
                'constraints' => [
                    new NotBlank(message: 'Please enter your name'),
                    new Length(
                        min: 2,
                        minMessage: 'Your name should be at least {{ limit }} characters',
                        max: 100
                    ),
                ],
                'attr' => [
                    'placeholder' => 'Full Name',
                    'class' => 'form-input',
                ],
            ])
            ->add('email', EmailType::class, [
                'constraints' => [
                    new NotBlank(message: 'Please enter your email'),
                    new Email(message: 'Please enter a valid email address'),
                ],
                'attr' => [
                    'placeholder' => 'Email Address',
                    'class' => 'form-input',
                ],
            ])
            ->add('plainPassword', RepeatedType::class, [
                'type' => PasswordType::class,
                'mapped' => false,
                'first_options' => [
                    'attr' => [
                        'placeholder' => 'Password',
                        'class' => 'form-input',
                        'autocomplete' => 'new-password',
                    ],
                    'constraints' => [
                        new NotBlank(message: 'Please enter a password'),
                        new Length(
                            min: 8,
                            minMessage: 'Your password should be at least {{ limit }} characters',
                            max: 4096
                        ),
                        new Regex(
                            pattern: '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/',
                            message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                        ),
                    ],
                ],
                'second_options' => [
                    'attr' => [
                        'placeholder' => 'Confirm Password',
                        'class' => 'form-input',
                        'autocomplete' => 'new-password',
                    ],
                ],
                'invalid_message' => 'The password fields must match.',
            ])
            ->add('agreeTerms', CheckboxType::class, [
                'mapped' => false,
                'constraints' => [
                    new IsTrue(message: 'You must agree to the terms of service.'),
                ],
                'label' => 'I agree to the Terms of Service',
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => User::class,
        ]);
    }
}
