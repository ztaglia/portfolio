// Portfolio JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Contact form handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar scroll effect
    const nav = document.querySelector('nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                nav.style.background = 'rgba(250, 246, 241, 0.95)';
                nav.style.backdropFilter = 'blur(10px)';
            } else {
                nav.style.background = 'linear-gradient(to bottom, var(--cream) 60%, transparent)';
                nav.style.backdropFilter = 'none';
            }
        });
    }

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.project-card, .skill-tag, .post-card').forEach(el => {
        observer.observe(el);
    });
});

// Contact form submission
async function handleContactSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const messageDiv = document.getElementById('form-message');
    
    // Get form data
    const formData = {
        name: form.querySelector('#name').value,
        email: form.querySelector('#email').value,
        subject: form.querySelector('#subject').value,
        message: form.querySelector('#message').value
    };

    // Disable button
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending...';

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.className = 'form-message success';
            messageDiv.textContent = data.message || 'Message sent successfully!';
            form.reset();
        } else {
            throw new Error(data.error || 'Failed to send message');
        }
    } catch (error) {
        messageDiv.className = 'form-message error';
        messageDiv.textContent = error.message;
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            Send Message
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        `;
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    .project-card, .skill-tag, .post-card {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .project-card.animate-in,
    .skill-tag.animate-in,
    .post-card.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .skill-tag:nth-child(1) { transition-delay: 0.1s; }
    .skill-tag:nth-child(2) { transition-delay: 0.15s; }
    .skill-tag:nth-child(3) { transition-delay: 0.2s; }
    .skill-tag:nth-child(4) { transition-delay: 0.25s; }
    .skill-tag:nth-child(5) { transition-delay: 0.3s; }
    .skill-tag:nth-child(6) { transition-delay: 0.35s; }
    
    .project-card:nth-child(1) { transition-delay: 0.1s; }
    .project-card:nth-child(2) { transition-delay: 0.2s; }
    .project-card:nth-child(3) { transition-delay: 0.3s; }
`;
document.head.appendChild(style);
