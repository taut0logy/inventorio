<?php

namespace App\Form;

use App\Entity\User;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\Length;
use Symfony\Component\Validator\Constraints\NotBlank;

class ProfileFormType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name', TextType::class, [
                'constraints' => [
                    new NotBlank(message: 'Please enter your name'),
                    new Length(min: 2, max: 100),
                ],
                'attr' => ['class' => 'form-input'],
            ])
            ->add('theme', ChoiceType::class, [
                'choices' => [
                    'Light' => 'light',
                    'Dark' => 'dark',
                ],
                'attr' => ['class' => 'form-select'],
            ])
            ->add('locale', ChoiceType::class, [
                'choices' => [
                    'English' => 'en',
                    'Bengali' => 'bn',
                ],
                'attr' => ['class' => 'form-select'],
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
