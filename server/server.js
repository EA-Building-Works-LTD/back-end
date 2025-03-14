// Import routes
const authRoutes = require('./routes/auth');
const builderRoutes = require('./routes/builders');
const formSubmissionRoutes = require('./routes/formSubmissions');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/builders', builderRoutes);
app.use('/api/form-submissions', formSubmissionRoutes); 