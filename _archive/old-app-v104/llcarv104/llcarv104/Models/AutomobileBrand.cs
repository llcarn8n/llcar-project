namespace llcar.Models
{
    public class InitializationCommand
    {
        public int step { get; set; }
        public string command { get; set; } = "";
        public string description { get; set; } = "";
        public string expectedResponse { get; set; } = "";
        public int timeoutMs { get; set; }
    }

    public class AutomobileBrand
    {
        public string id { get; set; } = "";
        public string name { get; set; } = "";
        public string country { get; set; } = "";
        public string modelYears { get; set; } = "";
        public List<string> protocols { get; set; } = new();
        public List<InitializationCommand> initializationCommands { get; set; } = new();
        public string notes { get; set; } = "";
    }
}