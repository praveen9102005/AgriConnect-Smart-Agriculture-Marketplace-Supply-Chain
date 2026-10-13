package com.agrimart.service;

import com.agrimart.dto.AuthRequest;
import com.agrimart.dto.AuthResponse;
import com.agrimart.dto.RegisterRequest;
import com.agrimart.entity.Farmer;
import com.agrimart.entity.Role;
import com.agrimart.entity.User;
import com.agrimart.exception.BadRequestException;
import com.agrimart.repository.FarmerRepository;
import com.agrimart.repository.UserRepository;
import com.agrimart.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       FarmerRepository farmerRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.farmerRepository = farmerRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String token = tokenProvider.generateToken(authentication);
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        Long farmerId = null;
        if (user.getRole() == Role.FARMER) {
            farmerId = farmerRepository.findByUserId(user.getId())
                    .map(Farmer::getId)
                    .orElse(null);
        }

        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole(), farmerId);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }

        User user = new User(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getRole() != null ? request.getRole() : Role.CUSTOMER
        );
        user = userRepository.save(user);

        Long farmerId = null;
        if (user.getRole() == Role.FARMER) {
            Farmer farmer = new Farmer(
                    user.getName(),
                    request.getState() != null ? request.getState() : "Maharashtra",
                    request.getLocation() != null ? request.getLocation() : "Nashik Valley",
                    request.getSpecialty() != null ? request.getSpecialty() : "Organic Crops",
                    request.getPhone() != null ? request.getPhone() : "+91 98765 43210",
                    user.getEmail(),
                    4.8,
                    true,
                    user
            );
            farmer = farmerRepository.save(farmer);
            farmerId = farmer.getId();
        }

        String token = tokenProvider.generateTokenFromUsername(user.getEmail());
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole(), farmerId);
    }
}
